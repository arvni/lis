<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\Listeners;

use App\Domains\PreOrder\Repositories\PreOrderRepository;
use App\Domains\PreOrder\Services\PreOrderWorkflow;
use App\Domains\Referrer\Events\ReferrerOrderUpdated;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

/** An order released from a pre-order changed in the lab: let the pre-order catch up. */
class SyncPreOrderFromReferrerOrder implements ShouldQueue
{
    public function viaQueue(): string
    {
        return (string) config('services.preorder_queue');
    }

    use InteractsWithQueue;

    public int $tries = 3;

    /** @var list<int> */
    public array $backoff = [10, 30, 60];

    public function __construct(
        private readonly PreOrderRepository $preOrders,
        private readonly PreOrderWorkflow $workflow,
    ) {}

    /** Most orders never came from a pre-order; don't queue a job for those. */
    public function shouldQueue(ReferrerOrderUpdated $event): bool
    {
        return $event->referrerOrder->pre_order_id !== null;
    }

    public function handle(ReferrerOrderUpdated $event): void
    {
        $preOrderId = $event->referrerOrder->pre_order_id;
        $preOrder = $preOrderId ? $this->preOrders->findById($preOrderId) : null;
        if ($preOrder) {
            $this->workflow->syncFromOrders($preOrder);
        }
    }
}
