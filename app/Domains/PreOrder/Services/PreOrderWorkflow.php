<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\Services;

use App\Domains\Document\Enums\DocumentTag;
use App\Domains\PreOrder\Adapters\DocumentAdapter;
use App\Domains\PreOrder\Adapters\LaboratoryAdapter;
use App\Domains\PreOrder\Adapters\ReferrerAdapter;
use App\Domains\PreOrder\DTOs\Actor;
use App\Domains\PreOrder\DTOs\CreatePreOrderDTO;
use App\Domains\PreOrder\DTOs\FinanceDecisionDTO;
use App\Domains\PreOrder\DTOs\QuoteDTO;
use App\Domains\PreOrder\DTOs\RaiseRequestDTO;
use App\Domains\PreOrder\Enums\ActionOwner;
use App\Domains\PreOrder\Enums\ExceptionType;
use App\Domains\PreOrder\Enums\FinanceDecision;
use App\Domains\PreOrder\Enums\FinanceStatus;
use App\Domains\PreOrder\Enums\HistoryType;
use App\Domains\PreOrder\Enums\ItemStatus;
use App\Domains\PreOrder\Enums\PreOrderStage;
use App\Domains\PreOrder\Enums\ReleasePurpose;
use App\Domains\PreOrder\Enums\RequestStatus;
use App\Domains\PreOrder\Enums\RequestType;
use App\Domains\PreOrder\Enums\Side;
use App\Domains\PreOrder\Enums\StartMode;
use App\Domains\PreOrder\Events\PreOrderChanged;
use App\Domains\PreOrder\Events\QuotationDecided;
use App\Domains\PreOrder\Exceptions\PreOrderRuleException;
use App\Domains\PreOrder\Models\PreOrder;
use App\Domains\PreOrder\Models\PreOrderItem;
use App\Domains\PreOrder\Models\PreOrderQuotation;
use App\Domains\PreOrder\Models\PreOrderRequest;
use App\Domains\PreOrder\Repositories\FlowRepository;
use App\Domains\PreOrder\Repositories\PreOrderRepository;
use App\Domains\PreOrder\Repositories\QuotationRepository;
use App\Domains\PreOrder\Support\FlowStages;
use App\Domains\PreOrder\Support\InspectedUpload;
use App\Domains\PreOrder\Support\LinkedOrder;
use App\Domains\PreOrder\Support\QuotationPdf;
use Closure;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * The only writer of a pre-order's stage. Every change runs here, under a row lock, writes its
 * history row and bumps the version the provider panel uses to drop stale snapshots.
 *
 * Stages only move forward. Anything BION needs later is a request on top of the stage; during
 * review (2–4) a request does move the stage, because that loop is what those stages are.
 */
class PreOrderWorkflow
{
    /** Open requests are due in a week unless BION says otherwise (open question in the spec). */
    public const DEFAULT_REQUEST_DAYS = 7;

    public function __construct(
        private readonly PreOrderRepository $preOrders,
        private readonly FlowRepository $flows,
        private readonly LaboratoryAdapter $laboratory,
        private readonly ReferrerAdapter $referrerOrders,
        private readonly DocumentAdapter $documents,
        private readonly FinanceRules $finance,
        private readonly QuotationService $quotationService,
        private readonly QuotationRepository $quotations,
        private readonly QuotationPdf $quotationPdf,
    ) {}

    // ---------------------------------------------------------------- center

    public function createDraft(int $referrerId, CreatePreOrderDTO $dto, Actor $actor): PreOrder
    {
        return $this->mutate(null, function () use ($referrerId, $dto, $actor) {
            $preOrder = $this->preOrders->create([
                'referrer_id' => $referrerId,
                'stage' => PreOrderStage::DRAFT,
                'action_owner' => ActionOwner::CENTER,
                'stage_entered_at' => now(),
                'start_mode' => $dto->startMode,
                'start_hint' => $dto->startHint,
                'referral_reason' => $dto->referralReason,
                'patients' => $dto->patients,
                'main_patient_ref' => $dto->mainPatientRef,
                'scope' => $dto->scope,
                'clinical' => $dto->clinical,
                'created_by' => ['name' => $actor->name],
            ]);

            foreach ($dto->tests as $line) {
                $test = $this->laboratory->findTest($line['test_id']);
                if (! $test || $this->laboratory->flowIdOf($test) === null) {
                    throw new PreOrderRuleException('One of the tests is not available for pre-orders.');
                }
                $this->preOrders->addItem($preOrder, [
                    'test_id' => $test->id,
                    'patient_ref' => $line['patient_ref'] ?? $dto->mainPatientRef,
                    'qty' => $line['qty'] ?? 1,
                    'unit_price' => $this->laboratory->unitPrice($test, $referrerId),
                    'added_by' => Side::CENTER,
                    'status' => ItemStatus::REQUESTED,
                ]);

                // The first test that can lead proposes the flow. BION confirms or changes it in review.
                if ($preOrder->main_test_id === null && $this->laboratory->canBeMain($test)) {
                    $this->applyMainTest($preOrder, $test->id);
                }
            }

            $this->history($preOrder, HistoryType::STAGE, $actor, toStage: PreOrderStage::DRAFT, body: 'Pre-order created');

            return $preOrder;
        });
    }

    public function submit(PreOrder $preOrder, Actor $actor): PreOrder
    {
        return $this->mutate($preOrder, function (PreOrder $preOrder) use ($actor) {
            $this->expectStage($preOrder, [PreOrderStage::DRAFT]);
            if ($preOrder->start_mode === StartMode::TESTS && $this->preOrders->activeItems($preOrder)->isEmpty()) {
                throw new PreOrderRuleException('Add at least one test, or describe the case and let BION choose.');
            }
            if ($preOrder->start_mode === StartMode::DESCRIBE && blank($preOrder->referral_reason)) {
                throw new PreOrderRuleException('Tell BION why the patient is referred.');
            }
            $preOrder->submitted_at = now();

            return $this->transition($preOrder, PreOrderStage::SUBMITTED, $actor);
        });
    }

    public function answerRequest(PreOrder $preOrder, int $requestNumber, string $answer, Actor $actor): PreOrder
    {
        return $this->mutate($preOrder, function (PreOrder $preOrder) use ($requestNumber, $answer, $actor) {
            $request = $this->findRequest($preOrder, $requestNumber);
            if ($request->status !== RequestStatus::OPEN) {
                throw new PreOrderRuleException("{$request->label()} is no longer waiting for an answer.");
            }
            $this->preOrders->updateRequest($request, [
                'status' => RequestStatus::ANSWERED,
                'answer' => $answer,
                'answered_at' => now(),
            ]);
            $this->history($preOrder, HistoryType::REQUEST, $actor, body: $answer, meta: ['request' => $request->number, 'event' => 'answered']);

            return $this->afterRequestChange($preOrder, $actor);
        });
    }

    // ---------------------------------------------------------------- BION review

    public function openReview(PreOrder $preOrder, Actor $actor): PreOrder
    {
        return $this->mutate($preOrder, function (PreOrder $preOrder) use ($actor) {
            $this->expectStage($preOrder, [PreOrderStage::SUBMITTED]);
            // Whoever opens the review takes the case, unless it was already given to someone.
            if ($preOrder->assigned_to === null && $actor->userId !== null) {
                $preOrder->assigned_to = $actor->userId;
            }

            return $this->transition($preOrder, PreOrderStage::UNDER_REVIEW, $actor);
        });
    }

    public function assign(PreOrder $preOrder, ?int $userId, Actor $actor): PreOrder
    {
        return $this->mutate($preOrder, function (PreOrder $preOrder) use ($userId, $actor) {
            $this->expectOpen($preOrder);
            $preOrder = $this->preOrders->update($preOrder, ['assigned_to' => $userId]);
            $name = $preOrder->load('assignee:id,name')->assignee?->name;
            $this->history($preOrder, HistoryType::DECISION, $actor, body: $name ? "Assigned to $name" : 'Unassigned', internal: true);

            return $preOrder;
        });
    }

    /**
     * Pick the main test, which sets the flow. The flow's stages are copied onto the pre-order,
     * so a later change to the flow never moves a case that is already running.
     */
    public function setMainTest(PreOrder $preOrder, int $testId, ?string $reason, Actor $actor): PreOrder
    {
        return $this->mutate($preOrder, function (PreOrder $preOrder) use ($testId, $reason, $actor) {
            $this->expectBeforeRelease($preOrder);
            $test = $this->laboratory->findTest($testId);
            if (! $test || $this->laboratory->flowIdOf($test) === null || ! $this->laboratory->canBeMain($test)) {
                throw new PreOrderRuleException('That test cannot be the main test of a pre-order.');
            }

            $hasLine = $this->preOrders->activeItems($preOrder)->contains(fn (PreOrderItem $i) => $i->test_id === $testId);
            if (! $hasLine) {
                $this->preOrders->addItem($preOrder, [
                    'test_id' => $testId,
                    'patient_ref' => $preOrder->main_patient_ref,
                    'qty' => 1,
                    'unit_price' => $this->laboratory->unitPrice($test, $preOrder->referrer_id),
                    'added_by' => Side::BION,
                    'status' => ItemStatus::RECOMMENDED,
                ]);
            }

            $this->applyMainTest($preOrder, $testId);
            $this->history($preOrder, HistoryType::DECISION, $actor, body: trim("Main test: {$test->name}. ".($reason ?? '')), meta: ['main_test_id' => $testId, 'flow_id' => $preOrder->flow_id]);

            return $this->preOrders->update($preOrder, []);
        });
    }

    /** BION recommends a test. Any catalogue test may ride along; only the main test sets the flow. */
    public function addTest(PreOrder $preOrder, int $testId, ?string $patientRef, int $qty, Actor $actor): PreOrderItem
    {
        $item = null;
        $this->mutate($preOrder, function (PreOrder $preOrder) use ($testId, $patientRef, $qty, $actor, &$item) {
            $this->expectBeforeRelease($preOrder);
            $test = $this->laboratory->findTest($testId) ?? throw new PreOrderRuleException('Test not found.');
            $item = $this->preOrders->addItem($preOrder, [
                'test_id' => $test->id,
                'patient_ref' => $patientRef ?? $preOrder->main_patient_ref,
                'qty' => max(1, $qty),
                'unit_price' => $this->laboratory->unitPrice($test, $preOrder->referrer_id),
                'added_by' => Side::BION,
                'status' => ItemStatus::RECOMMENDED,
            ]);
            $this->history($preOrder, HistoryType::DECISION, $actor, body: "Recommended {$test->name}", meta: ['item' => $item->id]);

            return $this->preOrders->update($preOrder, []);
        });

        /** @var PreOrderItem $item */
        return $item;
    }

    public function dropItem(PreOrder $preOrder, int $itemId, ?string $reason, Actor $actor): PreOrder
    {
        return $this->mutate($preOrder, function (PreOrder $preOrder) use ($itemId, $reason, $actor) {
            $this->expectBeforeRelease($preOrder);
            /** @var PreOrderItem|null $item */
            $item = $preOrder->items()->with('test')->find($itemId);
            if (! $item || $item->status === ItemStatus::DROPPED) {
                throw new PreOrderRuleException('That test line is not on this pre-order.');
            }
            if ($item->test_id === $preOrder->main_test_id) {
                throw new PreOrderRuleException('Pick another main test before removing this one.');
            }
            $this->preOrders->updateItem($item, ['status' => ItemStatus::DROPPED]);
            $this->history($preOrder, HistoryType::DECISION, $actor, body: trim("Removed {$item->test->name}. ".($reason ?? '')), meta: ['item' => $item->id]);

            return $this->preOrders->update($preOrder, []);
        });
    }

    public function raiseRequest(PreOrder $preOrder, RaiseRequestDTO $dto, Actor $actor): PreOrderRequest
    {
        $request = null;
        $this->mutate($preOrder, function (PreOrder $preOrder) use ($dto, $actor, &$request) {
            $this->expectOpen($preOrder);
            if ($preOrder->stage->rank() < PreOrderStage::UNDER_REVIEW->rank()) {
                throw new PreOrderRuleException('Open the review before asking the center for anything.');
            }
            $isTest = in_array(RequestType::TEST, $dto->types, true);
            if ($isTest && $preOrder->stage->rank() <= PreOrderStage::FINANCE_VERIFY->rank()) {
                // Before the tests are released BION edits the list itself.
                throw new PreOrderRuleException('Add the test to the pre-order directly; it is not released yet.');
            }
            if ($isTest && $dto->tests === []) {
                throw new PreOrderRuleException('Pick the additional tests.');
            }

            $request = $this->preOrders->addRequest($preOrder, [
                'types' => array_map(fn (RequestType $t) => $t->value, $dto->types),
                'reason' => $dto->reason,
                'message' => $dto->message,
                'needs' => $dto->needs,
                'blocking' => $dto->blocking,
                'due_at' => $dto->dueAt ?? now()->addDays(self::DEFAULT_REQUEST_DAYS),
                'status' => RequestStatus::OPEN,
                'raised_by' => $actor->userId,
            ]);
            $this->history($preOrder, HistoryType::REQUEST, $actor, body: $dto->message, meta: ['request' => $request->number, 'event' => 'raised']);

            if ($isTest) {
                $this->quoteRequestTests($preOrder, $request, $dto, $actor);
            }

            if (in_array($preOrder->stage, [PreOrderStage::UNDER_REVIEW, PreOrderStage::INFO_REVIEW], true)) {
                return $this->transition($preOrder, PreOrderStage::AWAITING_INFO, $actor, $request->label());
            }

            return $this->preOrders->update($preOrder, ['action_owner' => $this->ownerFor($preOrder)]);
        });

        /** @var PreOrderRequest $request */
        return $request;
    }

    public function closeRequest(PreOrder $preOrder, int $requestNumber, bool $declined, ?string $note, Actor $actor): PreOrder
    {
        return $this->mutate($preOrder, function (PreOrder $preOrder) use ($requestNumber, $declined, $note, $actor) {
            $request = $this->findRequest($preOrder, $requestNumber);
            if (! $request->status->isOpen()) {
                throw new PreOrderRuleException("{$request->label()} is already closed.");
            }
            $this->endRequest($preOrder, $request, $declined);
            $this->history($preOrder, HistoryType::REQUEST, $actor, body: $note, meta: ['request' => $request->number, 'event' => $declined ? 'declined' : 'closed']);

            return $this->afterRequestChange($preOrder, $actor);
        });
    }

    /**
     * BION is done reviewing: the tests are fixed. When the finance rules hold for lines the
     * center hasn't approved yet, they go to the center as a quotation first; otherwise every
     * line is released on one main order, which the center completes with sample details in the
     * provider panel, the same way as a direct order.
     */
    public function confirmTests(PreOrder $preOrder, Actor $actor, ?QuoteDTO $quote = null): PreOrder
    {
        return $this->mutate($preOrder, function (PreOrder $preOrder) use ($actor, $quote) {
            $this->expectStage($preOrder, [PreOrderStage::UNDER_REVIEW, PreOrderStage::INFO_REVIEW]);
            if ($preOrder->main_test_id === null || $preOrder->flow_id === null) {
                throw new PreOrderRuleException('Choose the main test first; it sets the flow.');
            }
            $items = $this->preOrders->activeItems($preOrder);
            if ($items->isEmpty()) {
                throw new PreOrderRuleException('There are no tests to release.');
            }
            $open = $this->preOrders->openRequests($preOrder);
            if ($open->contains(fn (PreOrderRequest $r) => $r->status === RequestStatus::OPEN)) {
                throw new PreOrderRuleException('Close or withdraw the open requests first.');
            }
            // Answers BION has read are settled by confirming.
            foreach ($open->filter(fn (PreOrderRequest $r) => $r->status === RequestStatus::ANSWERED) as $request) {
                $this->preOrders->updateRequest($request, ['status' => RequestStatus::CLOSED, 'closed_at' => now()]);
            }

            // Lines the center approved on an earlier (partial) quotation are not asked again.
            $pending = $items->reject(fn (PreOrderItem $i) => $i->status === ItemStatus::APPROVED)->values();
            $reasons = FlowStages::financeEnabled($preOrder) ? $this->finance->reasons($preOrder, $pending) : [];

            if ($reasons !== [] && $pending->isNotEmpty()) {
                $quotation = $this->quotationService->open($preOrder, $pending, null, $reasons, $quote ?? new QuoteDTO, $actor);
                $preOrder->unsetRelation('quotations');
                $this->history($preOrder, HistoryType::FINANCE, $actor, body: $quote?->reason, meta: ['quotation' => $quotation->number, 'event' => 'sent', 'total' => (string) $quotation->total]);

                return $this->transition($preOrder, PreOrderStage::AWAITING_FINANCE, $actor, $quotation->number);
            }
            if ($quote?->hasFinanceInput()) {
                throw new PreOrderRuleException('No quotation is needed, so prices and discounts don\'t apply.');
            }

            foreach ($pending as $item) {
                $this->preOrders->updateItem($item, ['status' => ItemStatus::APPROVED]);
            }

            return $this->releaseMain($preOrder, $actor, 'Tests confirmed and released to the lab');
        });
    }

    // ---------------------------------------------------------------- finance

    /**
     * The center's approver decides on a quotation. Approve releases the lines; partial keeps the
     * ticked lines and sends the pre-order back to review for the rest; reject raises the
     * "Financial approval rejected" exception. On an additional-test quotation the request carries
     * the outcome instead, and the pre-order's stage never moves.
     */
    public function decideFinance(PreOrder $preOrder, FinanceDecisionDTO $dto, Actor $actor): PreOrder
    {
        return $this->mutate($preOrder, function (PreOrder $preOrder) use ($dto, $actor) {
            $this->expectOpen($preOrder);
            $quotation = $this->quotations->findByNumber($preOrder, $dto->quotation)
                ?? throw new PreOrderRuleException("Quotation {$dto->quotation} was not found.");
            if (! $quotation->status->isOpen()) {
                throw new PreOrderRuleException("Quotation {$quotation->number} is {$quotation->status->label()}.");
            }
            $lines = $quotation->items->reject(fn (PreOrderItem $i) => $i->status === ItemStatus::DROPPED)->values();
            $kept = match ($dto->decision) {
                FinanceDecision::APPROVE => $lines,
                FinanceDecision::REJECT => new Collection,
                FinanceDecision::PARTIAL => $lines->filter(fn (PreOrderItem $i) => in_array($i->id, $dto->itemIds, true))->values(),
            };
            if ($dto->decision === FinanceDecision::PARTIAL) {
                if (count(array_unique($dto->itemIds)) !== $kept->count()) {
                    throw new PreOrderRuleException('Tick only lines from this quotation.');
                }
                if ($kept->isEmpty() || $kept->count() === $lines->count()) {
                    throw new PreOrderRuleException('A partial approval keeps some lines, not none or all.');
                }
            }
            if ($dto->decision === FinanceDecision::REJECT && blank($dto->note)) {
                throw new PreOrderRuleException('Tell BION why the quotation is rejected.');
            }

            $status = match ($dto->decision) {
                FinanceDecision::APPROVE => FinanceStatus::APPROVED,
                FinanceDecision::PARTIAL => FinanceStatus::PARTIALLY_APPROVED,
                FinanceDecision::REJECT => FinanceStatus::REJECTED,
            };
            $this->quotations->update($quotation, [
                'status' => $status,
                'approved_amount' => $dto->decision === FinanceDecision::APPROVE
                    ? $quotation->total
                    : $this->quotationService->approvedAmount($quotation, $kept),
                'decided_by' => $actor->name,
                'decided_at' => now(),
                'note' => $dto->note,
                'center_reference' => $dto->centerReference,
            ]);
            foreach ($kept as $item) {
                $this->preOrders->updateItem($item, ['status' => ItemStatus::APPROVED]);
            }
            $this->history($preOrder, HistoryType::FINANCE, $actor, body: $dto->note, meta: array_filter([
                'quotation' => $quotation->number,
                'event' => $dto->decision->value,
                'items' => $kept->pluck('id')->all(),
                'center_reference' => $dto->centerReference,
            ]));
            DB::afterCommit(fn () => QuotationDecided::dispatch($quotation));

            if ($quotation->request_id !== null) {
                return $this->afterRequestQuotation($preOrder, $quotation, $kept, $lines, $actor);
            }

            return match ($dto->decision) {
                FinanceDecision::APPROVE => FlowStages::uses($preOrder, PreOrderStage::FINANCE_VERIFY)
                    ? $this->transition($preOrder, PreOrderStage::FINANCE_VERIFY, $actor)
                    : $this->releaseMain($preOrder, $actor, "Quotation {$quotation->number} approved; tests released to the lab"),
                FinanceDecision::PARTIAL => $this->backToReview($preOrder, $actor, "Quotation {$quotation->number} partly approved"),
                FinanceDecision::REJECT => $this->raiseFinanceException($preOrder, 'rejected', $dto->note, $actor),
            };
        });
    }

    /** Stage 6, when the flow uses it: BION takes a second look before the samples are released. */
    public function verifyFinance(PreOrder $preOrder, Actor $actor): PreOrder
    {
        return $this->mutate($preOrder, function (PreOrder $preOrder) use ($actor) {
            $this->expectStage($preOrder, [PreOrderStage::FINANCE_VERIFY]);

            return $this->releaseMain($preOrder, $actor, 'Approval checked; tests released to the lab');
        });
    }

    /**
     * BION pulls the main quotation back, or answers a rejection or expiry, by returning to
     * review to change the lines and send a new quotation.
     */
    public function reviseQuotation(PreOrder $preOrder, ?string $reason, Actor $actor): PreOrder
    {
        return $this->mutate($preOrder, function (PreOrder $preOrder) use ($reason, $actor) {
            $this->expectStage($preOrder, [PreOrderStage::AWAITING_FINANCE]);
            $open = $this->quotations->openMain($preOrder);
            if ($open) {
                $this->quotations->update($open, ['status' => FinanceStatus::REVISION_REQUIRED]);
            } elseif (($preOrder->exception['type'] ?? null) !== ExceptionType::FINANCE_REJECTED->value) {
                throw new PreOrderRuleException('There is no quotation to revise.');
            }
            $preOrder->exception = null;
            $this->history($preOrder, HistoryType::FINANCE, $actor, body: $reason, meta: array_filter(['quotation' => $open?->number, 'event' => 'revise']));

            return $this->backToReview($preOrder, $actor, $reason ?? 'Quotation being revised');
        });
    }

    /** Daily: a quotation the center didn't decide on in time expires like a rejection. */
    public function expireQuotation(PreOrderQuotation $quotation): PreOrder
    {
        /** @var PreOrder $preOrder */
        $preOrder = $quotation->preOrder;

        return $this->mutate($preOrder, function (PreOrder $preOrder) use ($quotation) {
            $quotation = $this->quotations->findByNumber($preOrder, $quotation->number);
            if (! $quotation || ! $quotation->status->isOpen() || $preOrder->isClosed()) {
                return $preOrder;
            }
            $actor = Actor::system();
            $this->quotations->update($quotation, ['status' => FinanceStatus::EXPIRED]);
            $this->history($preOrder, HistoryType::FINANCE, $actor, body: "Quotation {$quotation->number} expired", meta: ['quotation' => $quotation->number, 'event' => 'expired']);
            DB::afterCommit(fn () => QuotationDecided::dispatch($quotation));

            if ($quotation->request_id !== null) {
                $lines = $quotation->items->reject(fn (PreOrderItem $i) => $i->status === ItemStatus::DROPPED)->values();

                return $this->afterRequestQuotation($preOrder, $quotation, new Collection, $lines, $actor);
            }

            return $this->raiseFinanceException($preOrder, 'expired', null, $actor);
        });
    }

    // ---------------------------------------------------------------- lab

    /**
     * Read the stage from the released orders. These stages are never set by hand, so the
     * pre-order and the lab can't disagree: it moves only when the orders do.
     */
    public function syncFromOrders(PreOrder $preOrder): PreOrder
    {
        return $this->mutate($preOrder, function (PreOrder $preOrder) {
            if ($preOrder->isClosed() || $preOrder->stage->rank() < PreOrderStage::AWAITING_SAMPLES->rank()) {
                return $preOrder;
            }
            $orders = $this->referrerOrders->linkedOrders($preOrder->id);
            if ($orders === []) {
                return $preOrder;
            }
            $closedRequests = $this->closePlacedRequests($preOrder, $orders);

            $all = fn (Closure $test) => array_reduce($orders, fn (bool $carry, LinkedOrder $o) => $carry && $test($o), true);
            $any = fn (Closure $test) => array_reduce($orders, fn (bool $carry, LinkedOrder $o) => $carry || $test($o), false);

            $target = match (true) {
                $all(fn (LinkedOrder $o) => $o->isReported()) => PreOrderStage::RESULTS_RELEASED,
                $all(fn (LinkedOrder $o) => $o->isReportReady()) => PreOrderStage::TESTING_COMPLETED,
                $any(fn (LinkedOrder $o) => $o->received) => PreOrderStage::TESTING,
                default => null,
            };

            if ($target === null || $target->rank() <= $preOrder->stage->rank()) {
                return $closedRequests ? $this->preOrders->update($preOrder, []) : $preOrder;
            }

            return $this->transition($preOrder, $target, Actor::system(), meta: ['orders' => array_map(fn (LinkedOrder $o) => $o->toArray(), $orders)]);
        });
    }

    // ---------------------------------------------------------------- both sides

    public function message(PreOrder $preOrder, string $body, Actor $actor, bool $internal = false): PreOrder
    {
        return $this->mutate($preOrder, function (PreOrder $preOrder) use ($body, $actor, $internal) {
            if ($internal && $actor->side !== Side::BION) {
                throw new PreOrderRuleException('Only BION can write internal notes.');
            }
            $this->history($preOrder, HistoryType::COMMENT, $actor, body: $body, internal: $internal);

            return $this->preOrders->update($preOrder, []);
        });
    }

    /**
     * A file the center attached, already inspected. Optionally tied to an open request, so BION
     * sees which question it answers; the request itself is answered separately.
     */
    public function addDocument(PreOrder $preOrder, InspectedUpload $upload, string $name, DocumentTag $tag, ?int $requestNumber, Actor $actor): PreOrder
    {
        return $this->mutate($preOrder, function (PreOrder $preOrder) use ($upload, $name, $tag, $requestNumber, $actor) {
            $this->expectOpen($preOrder);
            if ($requestNumber !== null && ! $this->preOrders->openRequests($preOrder)->contains('number', $requestNumber)) {
                throw new PreOrderRuleException("Request R{$requestNumber} is not open.");
            }
            $document = $this->documents->store($preOrder, $upload, $name, $tag);
            $this->history($preOrder, HistoryType::DOCUMENT, $actor, body: $document->originalName, meta: array_filter([
                'document' => $document->hash,
                'tag' => $tag->value,
                'request' => $requestNumber,
            ]));

            return $this->preOrders->update($preOrder, []);
        });
    }

    /**
     * File the quotation's PDF on the pre-order. Rendered before the row lock is taken, so a slow
     * render never holds up the case; a repeat for the same quotation is ignored.
     */
    public function attachQuotationPdf(PreOrderQuotation $quotation): ?PreOrder
    {
        /** @var PreOrder $preOrder */
        $preOrder = $quotation->preOrder()->with('referrer:id,fullName')->firstOrFail();
        if ($preOrder->documents()->where('related_type', 'pre_order_quotation')->where('related_id', $quotation->id)->exists()) {
            return null;
        }
        $pdf = $this->quotationPdf->render($preOrder, $quotation->load('items.test:id,name,code'));

        try {
            return $this->mutate($preOrder, function (PreOrder $preOrder) use ($quotation, $pdf) {
                $document = $this->documents->storeQuotation($preOrder, $quotation, $pdf);
                $this->history($preOrder, HistoryType::DOCUMENT, Actor::system(), body: $document->originalName, meta: [
                    'document' => $document->hash,
                    'tag' => DocumentTag::QUOTATION->value,
                    'quotation' => $quotation->number,
                ]);

                // The new version makes the panel take the snapshot that lists the file.
                return $this->preOrders->update($preOrder, []);
            });
        } finally {
            $pdf->discard();
        }
    }

    public function hold(PreOrder $preOrder, string $reason, ?string $comment, Actor $actor): PreOrder
    {
        return $this->mutate($preOrder, function (PreOrder $preOrder) use ($reason, $comment, $actor) {
            $this->expectOpen($preOrder);
            if ($preOrder->exception !== null) {
                throw new PreOrderRuleException('This pre-order is already on hold.');
            }
            $type = $actor->side === Side::CENTER ? ExceptionType::HOLD_CENTER : ExceptionType::HOLD_BION;
            $preOrder->exception = $this->exceptionRecord($type, $reason, $comment, $actor);
            $this->history($preOrder, HistoryType::EXCEPTION, $actor, body: $comment, meta: ['exception' => $type->value, 'reason' => $reason]);

            return $this->preOrders->update($preOrder, ['action_owner' => $this->ownerFor($preOrder)]);
        });
    }

    public function resume(PreOrder $preOrder, Actor $actor): PreOrder
    {
        return $this->mutate($preOrder, function (PreOrder $preOrder) use ($actor) {
            $this->expectOpen($preOrder);
            $type = ExceptionType::tryFrom((string) ($preOrder->exception['type'] ?? ''));
            if ($type === null) {
                throw new PreOrderRuleException('This pre-order is not on hold.');
            }
            // A center can lift only its own hold.
            if ($actor->side === Side::CENTER && $type !== ExceptionType::HOLD_CENTER) {
                throw new PreOrderRuleException('Only BION can lift this hold.');
            }
            if ($type === ExceptionType::FINANCE_REJECTED) {
                throw new PreOrderRuleException('Revise the quotation, or cancel the pre-order.');
            }
            $preOrder->exception = null;
            $this->history($preOrder, HistoryType::EXCEPTION, $actor, body: 'Resumed', meta: ['exception' => $type->value, 'event' => 'cleared']);

            return $this->preOrders->update($preOrder, ['action_owner' => $this->ownerFor($preOrder)]);
        });
    }

    /**
     * End the pre-order. A center may cancel only before anything went to the lab; once samples
     * have arrived it takes BION's override permission, checked by the caller.
     */
    public function close(PreOrder $preOrder, ExceptionType $type, string $reason, ?string $comment, Actor $actor, bool $override = false): PreOrder
    {
        return $this->mutate($preOrder, function (PreOrder $preOrder) use ($type, $reason, $comment, $actor, $override) {
            $this->expectOpen($preOrder);
            if (! $type->isFinal()) {
                throw new PreOrderRuleException('Use hold for a pause.');
            }
            $released = $preOrder->items()->where('status', ItemStatus::RELEASED->value)->exists();
            if ($actor->side === Side::CENTER && ($released || $type === ExceptionType::NOT_ELIGIBLE)) {
                throw new PreOrderRuleException('This pre-order already has an order. Ask BION to cancel it.');
            }
            $received = array_filter($this->referrerOrders->linkedOrders($preOrder->id), fn (LinkedOrder $o) => $o->received);
            if ($received !== [] && ! $override) {
                throw new PreOrderRuleException('Samples have arrived; cancelling now needs an override.');
            }

            $preOrder->exception = $this->exceptionRecord($type, $reason, $comment, $actor);
            $preOrder->closed_at = now();
            $this->history($preOrder, HistoryType::EXCEPTION, $actor, body: $comment, meta: ['exception' => $type->value, 'reason' => $reason, 'override' => $override]);

            return $this->preOrders->update($preOrder, ['action_owner' => ActionOwner::NONE]);
        });
    }

    // ---------------------------------------------------------------- internals

    /**
     * Run a change in a transaction with the row locked, and announce it once committed so the
     * snapshot webhook never reads a half-written pre-order.
     *
     * @template T
     *
     * @param  Closure(PreOrder|null): T  $change
     * @return T
     */
    private function mutate(?PreOrder $preOrder, Closure $change): mixed
    {
        return DB::transaction(function () use ($preOrder, $change) {
            $locked = $preOrder ? $this->preOrders->lock($preOrder) : null;
            $result = $change($locked);

            $changed = $result instanceof PreOrder ? $result : $locked;
            if ($changed instanceof PreOrder) {
                DB::afterCommit(fn () => PreOrderChanged::dispatch($changed));
                if ($preOrder && $preOrder !== $changed) {
                    $preOrder->setRawAttributes($changed->getAttributes(), true);
                }
            }

            return $result;
        });
    }

    /** @param  array<string, mixed>  $meta */
    private function transition(PreOrder $preOrder, PreOrderStage $to, Actor $actor, ?string $comment = null, array $meta = [], bool $back = false): PreOrder
    {
        $from = $preOrder->stage;
        // The two ways back: a new request during review, and finance returning to review.
        $allowedBack = ($to === PreOrderStage::AWAITING_INFO && $from === PreOrderStage::INFO_REVIEW)
            || ($back && $to === PreOrderStage::UNDER_REVIEW && in_array($from, [PreOrderStage::AWAITING_FINANCE, PreOrderStage::FINANCE_VERIFY], true));
        if ($to->rank() <= $from->rank() && ! $allowedBack) {
            throw new PreOrderRuleException("A pre-order can't go back from {$from->label()}.");
        }
        if (! FlowStages::uses($preOrder, $to)) {
            throw new PreOrderRuleException("This flow doesn't use {$to->label()}.");
        }

        $preOrder->stage = $to;
        $preOrder->stage_entered_at = now();
        if ($to->isFinal()) {
            $preOrder->closed_at = now();
        }
        $this->history($preOrder, HistoryType::STAGE, $actor, fromStage: $from, toStage: $to, body: $comment, meta: $meta);

        return $this->preOrders->update($preOrder, ['action_owner' => $this->ownerFor($preOrder)]);
    }

    /** Release every approved, unreleased line on the main order and move past finance. */
    private function releaseMain(PreOrder $preOrder, Actor $actor, string $note): PreOrder
    {
        $items = $this->preOrders->activeItems($preOrder)->filter(fn (PreOrderItem $i) => $i->status === ItemStatus::APPROVED)->values();
        if ($items->isEmpty()) {
            throw new PreOrderRuleException('There are no approved tests to release.');
        }
        $key = $this->release($preOrder, $items, ReleasePurpose::MAIN);
        $this->history($preOrder, HistoryType::DECISION, $actor, body: $note, meta: ['release_key' => $key, 'items' => $items->pluck('id')->all()]);

        $next = FlowStages::nextAfter($preOrder, PreOrderStage::FINANCE_VERIFY)
            ?? throw new PreOrderRuleException('The flow has no stage after review.');

        return $this->transition($preOrder, $next, $actor);
    }

    /** @param  Collection<int, PreOrderItem>  $items */
    private function release(PreOrder $preOrder, Collection $items, ReleasePurpose $purpose): string
    {
        $key = $this->nextReleaseKey($preOrder, $purpose);
        foreach ($items as $item) {
            $this->preOrders->updateItem($item, [
                'status' => ItemStatus::RELEASED,
                'release_key' => $key,
                'release_purpose' => $purpose,
            ]);
        }

        return $key;
    }

    /**
     * Partial approval and revisions are the one way back: to review, so BION can drop or replace
     * lines. Approved lines stay approved and are released with the rest.
     */
    private function backToReview(PreOrder $preOrder, Actor $actor, string $comment): PreOrder
    {
        foreach ($this->preOrders->activeItems($preOrder) as $item) {
            if ($item->status !== ItemStatus::APPROVED) {
                $this->preOrders->updateItem($item, ['status' => ItemStatus::RECOMMENDED]);
            }
        }

        return $this->transition($preOrder, PreOrderStage::UNDER_REVIEW, $actor, $comment, back: true);
    }

    private function raiseFinanceException(PreOrder $preOrder, string $reason, ?string $comment, Actor $actor): PreOrder
    {
        $preOrder->exception = $this->exceptionRecord(ExceptionType::FINANCE_REJECTED, $reason, $comment, $actor);
        $this->history($preOrder, HistoryType::EXCEPTION, $actor, body: $comment, meta: ['exception' => ExceptionType::FINANCE_REJECTED->value, 'reason' => $reason]);

        return $this->preOrders->update($preOrder, ['action_owner' => ActionOwner::BION]);
    }

    /**
     * An additional-test request gets its lines priced right away. Every line is BION's, so a
     * quotation is the normal case; the main approval is never edited.
     */
    private function quoteRequestTests(PreOrder $preOrder, PreOrderRequest $request, RaiseRequestDTO $dto, Actor $actor): void
    {
        $lines = [];
        foreach ($dto->tests as $line) {
            $test = $this->laboratory->findTest((int) $line['test_id']) ?? throw new PreOrderRuleException('Test not found.');
            $item = $this->preOrders->addItem($preOrder, [
                'test_id' => $test->id,
                'patient_ref' => $line['patient_ref'] ?? $preOrder->main_patient_ref,
                'qty' => max(1, (int) ($line['qty'] ?? 1)),
                'unit_price' => $this->laboratory->unitPrice($test, $preOrder->referrer_id),
                'added_by' => Side::BION,
                'status' => ItemStatus::RECOMMENDED,
                'request_id' => $request->id,
            ]);
            $lines[] = $item->setRelation('test', $test);
        }
        $items = new Collection($lines);

        $reasons = $this->finance->reasons($preOrder, $items, $dto->retest);
        $quote = $dto->quote ?? new QuoteDTO;
        // The quote's prices name tests, as the lines didn't exist yet when BION filled the form.
        $prices = [];
        foreach ($quote->prices as $testId => $price) {
            $item = $items->firstWhere('test_id', $testId) ?? throw new PreOrderRuleException('A price was given for a test that is not on this request.');
            $prices[$item->id] = $price;
        }
        $quote = new QuoteDTO($quote->reason ?? $dto->message, $quote->discount, $prices);

        if ($reasons === [] || ! FlowStages::financeEnabled($preOrder)) {
            foreach ($items as $item) {
                $this->preOrders->updateItem($item, ['status' => ItemStatus::APPROVED]);
            }
            $key = $this->release($preOrder, $items, ReleasePurpose::ADD_ON);
            $this->preOrders->updateRequest($request, ['status' => RequestStatus::ORDER_CREATED]);
            $this->history($preOrder, HistoryType::DECISION, $actor, body: "{$request->label()}: tests released on an add-on order", meta: ['request' => $request->number, 'release_key' => $key]);

            return;
        }

        $quotation = $this->quotationService->open($preOrder, $items, $request, $reasons, $quote, $actor);
        $this->preOrders->updateRequest($request, ['status' => RequestStatus::AWAITING_FINANCE]);
        $this->history($preOrder, HistoryType::FINANCE, $actor, body: $quote->reason, meta: ['quotation' => $quotation->number, 'request' => $request->number, 'event' => 'sent', 'total' => (string) $quotation->total]);
    }

    /**
     * The center decided on (or let expire) an additional-test quotation: the kept lines go to the
     * lab on an add-on order, the rest are dropped, and the request records the outcome.
     *
     * @param  Collection<int, PreOrderItem>  $kept
     * @param  Collection<int, PreOrderItem>  $lines
     */
    private function afterRequestQuotation(PreOrder $preOrder, PreOrderQuotation $quotation, Collection $kept, Collection $lines, Actor $actor): PreOrder
    {
        /** @var PreOrderRequest $request */
        $request = $preOrder->requests()->findOrFail($quotation->request_id);
        foreach ($lines as $line) {
            if (! $kept->contains('id', $line->id)) {
                $this->preOrders->updateItem($line, ['status' => ItemStatus::DROPPED]);
            }
        }

        if ($kept->isEmpty()) {
            $this->preOrders->updateRequest($request, ['status' => RequestStatus::DECLINED, 'closed_at' => now()]);
            $this->history($preOrder, HistoryType::REQUEST, $actor, meta: ['request' => $request->number, 'event' => 'declined']);
        } else {
            $key = $this->release($preOrder, $kept, ReleasePurpose::ADD_ON);
            $this->preOrders->updateRequest($request, ['status' => RequestStatus::ORDER_CREATED]);
            $this->history($preOrder, HistoryType::DECISION, $actor, body: "{$request->label()}: tests released on an add-on order", meta: ['request' => $request->number, 'release_key' => $key, 'items' => $kept->pluck('id')->all()]);
        }

        return $this->preOrders->update($preOrder, ['action_owner' => $this->ownerFor($preOrder)]);
    }

    /** Closing a request withdraws its quotation and drops its tests that never reached the lab. */
    private function endRequest(PreOrder $preOrder, PreOrderRequest $request, bool $declined): void
    {
        $quotation = $this->quotations->openForRequest($preOrder, $request->id);
        if ($quotation) {
            $this->quotations->update($quotation, ['status' => FinanceStatus::REVISION_REQUIRED]);
        }
        foreach ($request->items()->whereNotIn('status', [ItemStatus::RELEASED->value, ItemStatus::DROPPED->value])->get() as $item) {
            $this->preOrders->updateItem($item, ['status' => ItemStatus::DROPPED]);
        }
        $this->preOrders->updateRequest($request, [
            'status' => $declined ? RequestStatus::DECLINED : RequestStatus::CLOSED,
            'closed_at' => now(),
        ]);
    }

    /**
     * An add-on request is done once the center has placed its order.
     *
     * @param  list<LinkedOrder>  $orders
     */
    private function closePlacedRequests(PreOrder $preOrder, array $orders): bool
    {
        $placed = array_filter(array_map(fn (LinkedOrder $o) => $o->releaseKey, $orders));
        if ($placed === []) {
            return false;
        }
        $closed = false;
        foreach ($preOrder->requests()->where('status', RequestStatus::ORDER_CREATED->value)->with('items')->get() as $request) {
            $keys = $request->items->where('status', ItemStatus::RELEASED)->pluck('release_key')->filter()->unique();
            if ($keys->isNotEmpty() && $keys->every(fn ($k) => in_array($k, $placed, true))) {
                $this->preOrders->updateRequest($request, ['status' => RequestStatus::CLOSED, 'closed_at' => now()]);
                $this->history($preOrder, HistoryType::REQUEST, Actor::system(), body: 'Add-on order placed', meta: ['request' => $request->number, 'event' => 'closed']);
                $closed = true;
            }
        }

        return $closed;
    }

    /** After a request is answered or closed: leave the review wait once nothing is unanswered. */
    private function afterRequestChange(PreOrder $preOrder, Actor $actor): PreOrder
    {
        $stillOpen = $this->preOrders->openRequests($preOrder)->contains(fn (PreOrderRequest $r) => $r->status === RequestStatus::OPEN);
        if ($preOrder->stage === PreOrderStage::AWAITING_INFO && ! $stillOpen) {
            return $this->transition($preOrder, PreOrderStage::INFO_REVIEW, $actor);
        }

        return $this->preOrders->update($preOrder, ['action_owner' => $this->ownerFor($preOrder)]);
    }

    /** Who must act now: the stage's owner, unless a hold or a blocking request says otherwise. */
    private function ownerFor(PreOrder $preOrder): ActionOwner
    {
        if ($preOrder->closed_at !== null || $preOrder->stage->isFinal()) {
            return ActionOwner::NONE;
        }
        $exception = ExceptionType::tryFrom((string) ($preOrder->exception['type'] ?? ''));
        if ($exception === ExceptionType::HOLD_CENTER) {
            return ActionOwner::CENTER;
        }
        if ($exception === ExceptionType::HOLD_BION || $exception === ExceptionType::FINANCE_REJECTED) {
            return ActionOwner::BION;
        }
        if (! $preOrder->stage->isReview()) {
            $blocking = $this->preOrders->openRequests($preOrder)
                ->contains(fn (PreOrderRequest $r) => $r->blocking && $r->status === RequestStatus::OPEN);
            if ($blocking) {
                return ActionOwner::CENTER;
            }
        }

        return $preOrder->stage->defaultOwner();
    }

    private function applyMainTest(PreOrder $preOrder, int $testId): void
    {
        $test = $this->laboratory->findTest($testId);
        $flowId = $test ? $this->laboratory->flowIdOf($test) : null;
        $flow = $flowId ? $this->flows->findById($flowId) : null;
        if (! $flow || ! $flow->active) {
            throw new PreOrderRuleException('That test has no active flow.');
        }

        $preOrder->main_test_id = $testId;
        $preOrder->flow_id = $flow->id;
        $preOrder->flow_stages = $flow->stages;
        $preOrder->flow_version = $flow->version;
        $preOrder->save();
    }

    private function nextReleaseKey(PreOrder $preOrder, ReleasePurpose $purpose): string
    {
        $count = $preOrder->items()->whereNotNull('release_key')->distinct()->count('release_key');
        $letter = match ($purpose) {
            ReleasePurpose::PRE_TEST => 'P',
            ReleasePurpose::MAIN => 'M',
            ReleasePurpose::ADD_ON => 'A',
            ReleasePurpose::REPLACEMENT => 'R',
        };

        return $preOrder->code.'-'.$letter.($count + 1);
    }

    private function findRequest(PreOrder $preOrder, int $number): PreOrderRequest
    {
        /** @var PreOrderRequest|null $request */
        $request = $preOrder->requests()->where('number', $number)->first();

        return $request ?? throw new PreOrderRuleException("Request R$number was not found.");
    }

    /** @param  list<PreOrderStage>  $stages */
    private function expectStage(PreOrder $preOrder, array $stages): void
    {
        $this->expectOpen($preOrder);
        if (! in_array($preOrder->stage, $stages, true)) {
            throw new PreOrderRuleException("Not possible while the pre-order is at {$preOrder->stage->label()}.");
        }
    }

    private function expectOpen(PreOrder $preOrder): void
    {
        if ($preOrder->isClosed()) {
            throw new PreOrderRuleException('This pre-order is closed.');
        }
    }

    private function expectBeforeRelease(PreOrder $preOrder): void
    {
        $this->expectOpen($preOrder);
        if ($preOrder->stage->rank() > PreOrderStage::INFO_REVIEW->rank()) {
            throw new PreOrderRuleException('The tests are already released; raise an additional-test request instead.');
        }
    }

    /** @return array<string, mixed> */
    private function exceptionRecord(ExceptionType $type, string $reason, ?string $comment, Actor $actor): array
    {
        return [
            'type' => $type->value,
            'reason' => $reason,
            'comment' => $comment,
            'side' => $actor->side->value,
            'by' => $actor->name,
            'at' => now()->toIso8601String(),
        ];
    }

    /** @param  array<string, mixed>  $meta */
    private function history(
        PreOrder $preOrder,
        HistoryType $type,
        Actor $actor,
        ?PreOrderStage $fromStage = null,
        ?PreOrderStage $toStage = null,
        ?string $body = null,
        bool $internal = false,
        array $meta = [],
    ): void {
        $this->preOrders->addHistory($preOrder, [
            'type' => $type,
            'from_stage' => $fromStage?->value,
            'to_stage' => $toStage?->value,
            'body' => $body,
            'internal' => $internal,
            'user_id' => $actor->userId,
            'side' => $actor->side,
            'actor_name' => $actor->name,
            'meta' => $meta ?: null,
        ]);
    }
}
