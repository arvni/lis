<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\Listeners;

use App\Domains\PreOrder\Enums\ActionStatus;
use App\Domains\PreOrder\Events\PreOrderActionProcessed;
use App\Domains\PreOrder\Support\ProviderWebhook;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

/** Tells the panel an action it sent was applied or refused, so it can clear "Sending…". */
class SendPreOrderActionResultWebhook implements ShouldQueue
{
    use InteractsWithQueue;

    public int $tries = 3;

    /** @var list<int> */
    public array $backoff = [10, 30, 60];

    public function handle(PreOrderActionProcessed $event): void
    {
        $action = $event->action;
        ProviderWebhook::post('preorder_action_result_webhook_url', '/webhooks/pre-orders/action-result', [
            'action_id' => $action->uuid,
            'ok' => $action->status === ActionStatus::DONE,
            'error' => $action->error,
            'pre_order_id' => $action->pre_order_id,
        ]);
    }
}
