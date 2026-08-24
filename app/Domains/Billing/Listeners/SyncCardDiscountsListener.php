<?php

declare(strict_types=1);

namespace App\Domains\Billing\Listeners;

use App\Domains\Billing\Adapters\ReceptionAdapter;
use App\Domains\Billing\Services\CardDiscountSyncService;
use App\Domains\Reception\Events\AcceptanceItemsChangedEvent;

class SyncCardDiscountsListener
{
    public function __construct(
        private readonly ReceptionAdapter $receptionAdapter,
        private readonly CardDiscountSyncService $syncService,
    ) {}

    public function handle(AcceptanceItemsChangedEvent $event): void
    {
        $acceptance = $this->receptionAdapter->findAcceptance($event->acceptanceId);

        // Nothing to do for an acceptance that never had a card on it.
        if (! $acceptance || ! $acceptance->discount_card_id) {
            return;
        }

        $this->syncService->sync($acceptance, auth()->id());
    }
}
