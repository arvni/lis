<?php

namespace App\Domains\Billing\Listeners;

use App\Domains\Billing\Services\InvoiceService;
use App\Domains\Reception\Services\AcceptanceService;

class InvoiceAcceptanceDeletedListener
{
    /**
     * Create the event listener.
     */
    public function __construct(protected InvoiceService $invoiceService)
    {
        //
    }

    /**
     * Handle the event.
     */
    public function handle(object $event): void
    {
        $invoice = $this->invoiceService->findInvoiceById($event->invoiceId);
        if ($invoice) {
            $this->invoiceService->deleteInvoice($invoice);
        }
    }
}
