<?php

declare(strict_types=1);

namespace App\Domains\Billing\Listeners;

use App\Domains\Billing\Adapters\ReceptionAdapter;
use App\Domains\Billing\Services\CardDiscountSyncService;
use App\Domains\Reception\Events\AcceptanceCardReleasedEvent;

class ReleaseCardDiscountsListener
{
    public function __construct(
        private readonly ReceptionAdapter $receptionAdapter,
        private readonly CardDiscountSyncService $syncService,
    ) {}

    public function handle(AcceptanceCardReleasedEvent $event): void
    {
        $acceptance = $this->receptionAdapter->findAcceptance($event->acceptanceId);

        if (! $acceptance || ! $acceptance->discount_card_id) {
            return;
        }

        $this->syncService->revertAll($acceptance, $event->reason);
    }
}
