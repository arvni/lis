<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Domains\PreOrder\Events\PreOrderChanged;
use App\Domains\PreOrder\Models\PreOrder;
use App\Domains\PreOrder\Repositories\PreOrderRepository;
use App\Domains\PreOrder\Services\PreOrderWorkflow;
use Illuminate\Console\Command;

/**
 * Nightly safety net: catch up open pre-orders with their orders (in case an order event was
 * missed) and re-send their snapshots, so a provider-panel mirror that missed a webhook heals.
 */
class ReconcilePreOrders extends Command
{
    protected $signature = 'pre-orders:reconcile';

    protected $description = 'Re-read open pre-orders from their orders and re-send their snapshots.';

    public function handle(PreOrderRepository $preOrders, PreOrderWorkflow $workflow): int
    {
        $count = 0;
        $preOrders->openWithLinkedOrders()->chunkById(100, function ($chunk) use ($workflow, &$count) {
            foreach ($chunk as $preOrder) {
                /** @var PreOrder $preOrder */
                $synced = $workflow->syncFromOrders($preOrder);
                PreOrderChanged::dispatch($synced);
                $count++;
            }
        });
        $this->info("Reconciled $count pre-order(s).");

        return self::SUCCESS;
    }
}
