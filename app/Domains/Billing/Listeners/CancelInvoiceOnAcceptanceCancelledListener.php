<?php

namespace App\Domains\Billing\Listeners;

use App\Domains\Billing\Enums\InvoiceStatus;
use App\Domains\Billing\Services\InvoiceService;

class CancelInvoiceOnAcceptanceCancelledListener
{
    public function __construct(protected InvoiceService $invoiceService)
    {
    }

    public function handle(object $event): void
    {
        $invoice = $this->invoiceService->findInvoiceById($event->invoiceId);
        if ($invoice) {
            $invoice->update(['status' => InvoiceStatus::CANCELED]);
        }
    }
}
