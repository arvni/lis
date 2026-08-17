<?php

declare(strict_types=1);

namespace App\Domains\Billing\Listeners;

use App\Domains\Billing\Services\InvoiceService;

class InvoiceAcceptanceRestoredListener
{
    public function __construct(protected InvoiceService $invoiceService)
    {
        //
    }

    /**
     * Handle the event.
     *
     * The delete parked the invoice as cancelled; bringing the acceptance back
     * hands the status to updateStatus(), which derives it from what has
     * actually been paid rather than assuming what it was before.
     */
    public function handle(object $event): void
    {
        $invoice = $this->invoiceService->findInvoiceById($event->invoiceId);
        if ($invoice) {
            $this->invoiceService->updateStatus($invoice);
        }
    }
}
