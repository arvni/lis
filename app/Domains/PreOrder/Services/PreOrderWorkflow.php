<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\Services;

use App\Domains\PreOrder\Adapters\LaboratoryAdapter;
use App\Domains\PreOrder\Adapters\ReferrerAdapter;
use App\Domains\PreOrder\DTOs\Actor;
use App\Domains\PreOrder\DTOs\CreatePreOrderDTO;
use App\Domains\PreOrder\DTOs\RaiseRequestDTO;
use App\Domains\PreOrder\Enums\ActionOwner;
use App\Domains\PreOrder\Enums\ExceptionType;
use App\Domains\PreOrder\Enums\HistoryType;
use App\Domains\PreOrder\Enums\ItemStatus;
use App\Domains\PreOrder\Enums\PreOrderStage;
use App\Domains\PreOrder\Enums\ReleasePurpose;
use App\Domains\PreOrder\Enums\RequestStatus;
use App\Domains\PreOrder\Enums\RequestType;
use App\Domains\PreOrder\Enums\Side;
use App\Domains\PreOrder\Enums\StartMode;
use App\Domains\PreOrder\Events\PreOrderChanged;
use App\Domains\PreOrder\Exceptions\PreOrderRuleException;
use App\Domains\PreOrder\Models\PreOrder;
use App\Domains\PreOrder\Models\PreOrderItem;
use App\Domains\PreOrder\Models\PreOrderRequest;
use App\Domains\PreOrder\Repositories\FlowRepository;
use App\Domains\PreOrder\Repositories\PreOrderRepository;
use App\Domains\PreOrder\Support\FlowStages;
use App\Domains\PreOrder\Support\LinkedOrder;
use Closure;
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

    public function assign(PreOrder $preOrder, ?int $userId, string $userName, Actor $actor): PreOrder
    {
        return $this->mutate($preOrder, function (PreOrder $preOrder) use ($userId, $userName, $actor) {
            $this->expectOpen($preOrder);
            $this->history($preOrder, HistoryType::DECISION, $actor, body: $userId ? "Assigned to $userName" : 'Unassigned', internal: true);

            return $this->preOrders->update($preOrder, ['assigned_to' => $userId]);
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
            if (in_array(RequestType::TEST, $dto->types, true)) {
                // An additional test brings its own quotation and add-on order (phase 2).
                throw new PreOrderRuleException('Additional-test requests are not available yet.');
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
            $this->preOrders->updateRequest($request, [
                'status' => $declined ? RequestStatus::DECLINED : RequestStatus::CLOSED,
                'closed_at' => now(),
            ]);
            $this->history($preOrder, HistoryType::REQUEST, $actor, body: $note, meta: ['request' => $request->number, 'event' => $declined ? 'declined' : 'closed']);

            return $this->afterRequestChange($preOrder, $actor);
        });
    }

    /**
     * BION is done reviewing: the tests are fixed and go to the lab. With no finance yet (phase 2)
     * every remaining line is approved and released on one main order, which the center completes
     * with sample details in the provider panel, the same way as a direct order.
     */
    public function confirmTests(PreOrder $preOrder, Actor $actor): PreOrder
    {
        return $this->mutate($preOrder, function (PreOrder $preOrder) use ($actor) {
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
            foreach ($open as $request) {
                $this->preOrders->updateRequest($request, ['status' => RequestStatus::CLOSED, 'closed_at' => now()]);
            }

            $key = $this->nextReleaseKey($preOrder, ReleasePurpose::MAIN);
            foreach ($items as $item) {
                $this->preOrders->updateItem($item, [
                    'status' => ItemStatus::RELEASED,
                    'release_key' => $key,
                    'release_purpose' => ReleasePurpose::MAIN,
                ]);
            }
            $this->history($preOrder, HistoryType::DECISION, $actor, body: 'Tests confirmed and released to the lab', meta: ['release_key' => $key, 'items' => $items->pluck('id')->all()]);

            $next = FlowStages::nextAfter($preOrder, PreOrderStage::INFO_REVIEW)
                ?? throw new PreOrderRuleException('The flow has no stage after review.');

            return $this->transition($preOrder, $next, $actor);
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

            $all = fn (Closure $test) => array_reduce($orders, fn (bool $carry, LinkedOrder $o) => $carry && $test($o), true);
            $any = fn (Closure $test) => array_reduce($orders, fn (bool $carry, LinkedOrder $o) => $carry || $test($o), false);

            $target = match (true) {
                $all(fn (LinkedOrder $o) => $o->isReported()) => PreOrderStage::RESULTS_RELEASED,
                $all(fn (LinkedOrder $o) => $o->isReportReady()) => PreOrderStage::TESTING_COMPLETED,
                $any(fn (LinkedOrder $o) => $o->received) => PreOrderStage::TESTING,
                default => null,
            };

            if ($target === null || $target->rank() <= $preOrder->stage->rank()) {
                return $preOrder;
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

    private function transition(PreOrder $preOrder, PreOrderStage $to, Actor $actor, ?string $comment = null, array $meta = []): PreOrder
    {
        $from = $preOrder->stage;
        if ($to->rank() <= $from->rank() && ! ($to === PreOrderStage::AWAITING_INFO && $from === PreOrderStage::INFO_REVIEW)) {
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
        if ($exception === ExceptionType::HOLD_BION) {
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
