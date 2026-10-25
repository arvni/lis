<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\Services;

use App\Domains\PreOrder\Adapters\DocumentAdapter;
use App\Domains\PreOrder\Enums\ItemStatus;
use App\Domains\PreOrder\Enums\PreOrderStage;
use App\Domains\PreOrder\Models\PreOrder;
use App\Domains\PreOrder\Models\PreOrderHistory;
use App\Domains\PreOrder\Models\PreOrderItem;
use App\Domains\PreOrder\Repositories\PreOrderRepository;
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
    ) {}

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

        $prices = $preOrder->items->mapWithKeys(fn (PreOrderItem $i) => [$i->id => $i->unit_price]);
        $view['items'] = array_map(fn (array $item) => [...$item, 'unit_price' => $prices[$item['id']] ?? null], $view['items']);
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
        $view['referrer'] = $preOrder->referrer?->only(['id', 'fullName']);
        $view['assignee'] = $preOrder->assignee?->only(['id', 'name']);
        $view['can'] = $this->allowed($preOrder);

        return $view;
    }

    /** @return array<string, bool> */
    private function allowed(PreOrder $preOrder): array
    {
        $open = ! $preOrder->isClosed();
        $stage = $preOrder->stage;
        $beforeRelease = $open && $stage->rank() >= PreOrderStage::SUBMITTED->rank() && $stage->rank() <= PreOrderStage::INFO_REVIEW->rank();

        return [
            'open_review' => $open && $stage === PreOrderStage::SUBMITTED,
            'edit_tests' => $beforeRelease,
            'raise_request' => $open && $stage->rank() >= PreOrderStage::UNDER_REVIEW->rank(),
            'confirm' => $open && in_array($stage, [PreOrderStage::UNDER_REVIEW, PreOrderStage::INFO_REVIEW], true),
            'hold' => $open && $preOrder->exception === null,
            'resume' => $open && $preOrder->exception !== null,
            'close' => $open,
            'stage_is_read_from_orders' => FlowStages::uses($preOrder, $stage) && $stage->isReadFromOrders(),
        ];
    }
}
