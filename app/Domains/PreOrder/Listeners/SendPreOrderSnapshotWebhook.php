<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\Listeners;

use App\Domains\PreOrder\Events\PreOrderChanged;
use App\Domains\PreOrder\Support\PreOrderSnapshot;
use App\Domains\PreOrder\Support\ProviderWebhook;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

/**
 * Sends the full center-visible snapshot after every change. Built when the job runs, not when
 * the event fired, so a burst of changes still ends on the latest state; the panel drops any
 * snapshot whose version is older than the one it has.
 */
class SendPreOrderSnapshotWebhook implements ShouldQueue
{
    public function viaQueue(): string
    {
        return (string) config('services.preorder_queue');
    }

    use InteractsWithQueue;

    public int $tries = 3;

    /** @var list<int> */
    public array $backoff = [10, 30, 60];

    public function __construct(private readonly PreOrderSnapshot $snapshot) {}

    public function handle(PreOrderChanged $event): void
    {
        ProviderWebhook::post('preorder_upsert_webhook_url', '/webhooks/pre-orders/upsert', $this->snapshot->build($event->preOrder));
    }
}
