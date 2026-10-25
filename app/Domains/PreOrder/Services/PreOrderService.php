<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\Services;

use App\Domains\Document\Models\Document;
use App\Domains\PreOrder\Adapters\DocumentAdapter;
use App\Domains\PreOrder\Adapters\LaboratoryAdapter;
use App\Domains\PreOrder\Enums\ExceptionType;
use App\Domains\PreOrder\Enums\FinanceReason;
use App\Domains\PreOrder\Enums\ItemStatus;
use App\Domains\PreOrder\Enums\PreOrderStage;
use App\Domains\PreOrder\Models\PreOrder;
use App\Domains\PreOrder\Models\PreOrderHistory;
use App\Domains\PreOrder\Models\PreOrderItem;
use App\Domains\PreOrder\Models\PreOrderQuotation;
use App\Domains\PreOrder\Repositories\PreOrderRepository;
use App\Domains\PreOrder\Repositories\QuotationRepository;
use App\Domains\PreOrder\Support\FlowStages;
use App\Domains\PreOrder\Support\PreOrderSnapshot;
use Illuminate\Pagination\LengthAwarePaginator;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

/** Read side of the BION screens. Changes go through PreOrderWorkflow. */
class PreOrderService
{
    public function __construct(
        private readonly PreOrderRepository $preOrders,
        private readonly PreOrderSnapshot $snapshot,
        private readonly DocumentAdapter $documents,
        private readonly FinanceRules $finance,
        private readonly QuotationRepository $quotations,
        private readonly LaboratoryAdapter $laboratory,
    ) {}

    /**
     * @param  array<string, mixed>  $filters
     * @return LengthAwarePaginator<int, PreOrderQuotation>
     */
    public function financeDesk(array $filters): LengthAwarePaginator
    {
        return $this->quotations->desk($filters);
    }

    public function download(PreOrder $preOrder, string $hash): BinaryFileResponse
    {
        return $this->documents->download($preOrder, $hash);
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return LengthAwarePaginator<int, PreOrder>
     */
    public function queue(array $filters): LengthAwarePaginator
    {
        return $this->preOrders->queue($filters);
    }

    /**
     * The center's view plus what only BION sees: prices, internal notes, who did what, and
     * which actions the current stage allows.
     *
     * @return array<string, mixed>
     */
    public function detail(PreOrder $preOrder): array
    {
        $view = $this->snapshot->build($preOrder);
        $preOrder = $this->preOrders->loadDetail($preOrder);

        // BION-only line details: the price and the method that set it. The center's snapshot
        // carries neither the method nor its choices.
        $lines = $preOrder->items->keyBy('id');
        $methods = $this->laboratory->methodOptionsFor($preOrder->items->pluck('test')->unique('id'));
        $view['items'] = array_map(function (array $item) use ($lines, $methods) {
            $line = $lines[$item['id']] ?? null;

            return [
                ...$item,
                'unit_price' => $line?->unit_price,
                'method_test_id' => $line?->method_test_id,
                'needs_method' => $line !== null && $this->laboratory->needsMethod($line->test),
                'methods' => $methods[$item['test_id']] ?? [],
            ];
        }, $view['items']);
        $view['dropped_items'] = $preOrder->items
            ->filter(fn (PreOrderItem $i) => $i->status === ItemStatus::DROPPED)
            ->map(fn (PreOrderItem $i) => ['id' => $i->id, 'test_name' => $i->test->name, 'patient_ref' => $i->patient_ref])
            ->values()->all();
        $view['notes'] = $preOrder->histories
            ->filter(fn (PreOrderHistory $h) => $h->internal)
            ->map(fn (PreOrderHistory $h) => [
                'id' => $h->id,
                'body' => $h->body,
                'actor_name' => $h->actor_name,
                'created_at' => $h->created_at?->toIso8601String(),
            ])->values()->all();
        // Every file, internal ones included, and whether the center sees it.
        $view['documents'] = $preOrder->documents->map(fn (Document $d) => [
            'hash' => $d->hash,
            'name' => $d->originalName,
            'tag' => $d->tag,
            'ext' => $d->ext,
            'from' => DocumentAdapter::isFromBion($d) ? 'bion' : 'center',
            'shared' => ! DocumentAdapter::isInternal($d),
            'created_at' => $d->created_at?->toIso8601String(),
        ])->values()->all();
        $view['document_tags'] = DocumentAdapter::staffTagValues();
        $view['referrer'] = $preOrder->referrer?->only(['id', 'fullName']);
        $view['assignee'] = $preOrder->assignee?->only(['id', 'name']);
        // Whether confirming now sends a quotation, and why, so BION knows before clicking.
        $pending = $preOrder->items->filter(fn (PreOrderItem $i) => ! in_array($i->status, [ItemStatus::DROPPED, ItemStatus::APPROVED, ItemStatus::RELEASED], true))->values();
        $view['finance_preview'] = FlowStages::financeEnabled($preOrder) && $preOrder->stage->isReview()
            ? array_map(fn (FinanceReason $r) => $r->label(), $this->finance->reasons($preOrder, $pending))
            : [];
        $view['can'] = $this->allowed($preOrder);

        return $view;
    }

    /** @return array<string, bool> */
    private function allowed(PreOrder $preOrder): array
    {
        $open = ! $preOrder->isClosed();
        $stage = $preOrder->stage;
        $exception = ExceptionType::tryFrom((string) ($preOrder->exception['type'] ?? ''));
        $beforeRelease = $open && $stage->rank() >= PreOrderStage::SUBMITTED->rank() && $stage->rank() <= PreOrderStage::INFO_REVIEW->rank();

        return [
            'open_review' => $open && $stage === PreOrderStage::SUBMITTED,
            'edit_tests' => $beforeRelease,
            'raise_request' => $open && $stage->rank() >= PreOrderStage::UNDER_REVIEW->rank(),
            'confirm' => $open && in_array($stage, [PreOrderStage::UNDER_REVIEW, PreOrderStage::INFO_REVIEW], true),
            'hold' => $open && $preOrder->exception === null,
            'resume' => $open && $preOrder->exception !== null && $exception !== ExceptionType::FINANCE_REJECTED,
            'verify_finance' => $open && $stage === PreOrderStage::FINANCE_VERIFY,
            'revise_quotation' => $open && $stage === PreOrderStage::AWAITING_FINANCE,
            // Additional tests come as a request once the main tests are released.
            'request_test' => $open && $stage->rank() > PreOrderStage::FINANCE_VERIFY->rank(),
            'close' => $open,
            'set_pre_test' => $beforeRelease && FlowStages::preTestEnabled($preOrder),
            // The center normally confirms; BION can record it for them (e.g. after a phone call).
            'confirm_next_step' => $open && $stage === PreOrderStage::PRE_COMPLETED,
            'close_batches' => $open && $stage === PreOrderStage::BATCH_OPEN,
            'start_testing' => $open && $stage === PreOrderStage::READY_FOR_TESTING && $exception !== ExceptionType::SAMPLE_ISSUE,
            'sample_issue' => $open && $preOrder->exception === null && $stage->rank() >= PreOrderStage::AWAITING_PRE_SAMPLES->rank(),
            'stage_is_read_from_orders' => FlowStages::uses($preOrder, $stage) && $stage->isReadFromOrders(),
        ];
    }
}
