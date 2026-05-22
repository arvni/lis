<?php

namespace App\Domains\Reception\Listeners;

use App\Domains\Billing\Services\InvoiceComposer;
use App\Domains\Billing\Services\InvoiceService;
use App\Domains\Reception\Services\AcceptanceService;

class AcceptanceInvoiceListener
{
    public function __construct(
        protected AcceptanceService $acceptanceService,
        protected InvoiceService $invoiceService,
        protected InvoiceComposer $invoiceComposer,
    )
    {
    }

    public function handle(object $event): void
    {
        $acceptance = $this->acceptanceService->getAcceptanceById($event->acceptanceId);
        if (! $acceptance) {
            return;
        }
        $this->acceptanceService->updateAcceptanceInvoice($acceptance, $event->invoiceId);

        $invoice = $this->invoiceService->findInvoiceById($event->invoiceId);
        if ($invoice) {
            $this->invoiceComposer->recompose($invoice);
        }
    }
}
