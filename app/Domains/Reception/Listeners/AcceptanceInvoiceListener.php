<?php

namespace App\Domains\Reception\Listeners;

use App\Domains\Reception\Services\AcceptanceService;

class AcceptanceInvoiceListener
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
        if ($acceptance) {
            $this->acceptanceService->updateAcceptanceInvoice($acceptance, $event->invoiceId);
        }
    }
}
