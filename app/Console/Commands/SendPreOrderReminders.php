<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Domains\PreOrder\Repositories\PreOrderRepository;
use App\Domains\PreOrder\Services\PreOrderWorkflow;
use Illuminate\Console\Command;
use Throwable;

/** Hourly: remind, then escalate, pre-orders that sat in a stage past their flow's delays. */
class SendPreOrderReminders extends Command
{
    protected $signature = 'pre-orders:send-reminders';

    protected $description = 'Remind and escalate pre-orders stuck in a stage.';

    public function handle(PreOrderRepository $preOrders, PreOrderWorkflow $workflow): int
    {
        $sent = 0;
        foreach ($preOrders->awaitingReminder() as $preOrder) {
            try {
                $sent += $workflow->remindIfDue($preOrder) ? 1 : 0;
            } catch (Throwable $e) {
                // One bad case must not keep the others from being chased.
                report($e);
            }
        }
        $this->info("Sent $sent reminder(s).");

        return self::SUCCESS;
    }
}
