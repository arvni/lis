<?php

namespace App\Domains\Reception\Listeners;

use App\Domains\Reception\Enums\AcceptanceStatus;
use App\Domains\Reception\Services\AcceptanceService;

class AcceptancePaymentListener
{
    /**
     * Create the event listener.
     */
    public function __construct(protected AcceptanceService $acceptanceService)
    {
        //
    }

    /**
     * Handle the event.
     */
    public function handle(object $event): void
    {
        $acceptance = $this->acceptanceService->getAcceptanceById($event->acceptanceId);
        if ($acceptance && $acceptance->status == AcceptanceStatus::WAITING_FOR_PAYMENT) {
            $this->acceptanceService->updateAcceptanceStatus($acceptance, AcceptanceStatus::SAMPLING);
        }
    }
}
