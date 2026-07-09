<?php

declare(strict_types=1);

namespace App\Domains\Reception\Listeners;

use App\Domains\Reception\Adapters\BillingAdapter;
use App\Domains\Reception\Services\AcceptanceService;

class AcceptanceInvoiceListener
{
    public function __construct(
        protected AcceptanceService $acceptanceService,
        protected BillingAdapter $billingAdapter,
    ) {}

    public function handle(object $event): void
    {
        $acceptance = $this->acceptanceService->getAcceptanceById($event->acceptanceId);
        if (! $acceptance) {
            return;
        }
        $this->acceptanceService->updateAcceptanceInvoice($acceptance, $event->invoiceId);

        $invoice = $this->billingAdapter->findInvoiceById($event->invoiceId);
        if ($invoice) {
            $this->billingAdapter->recomposeInvoice($invoice);
        }
    }
}
