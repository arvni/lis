<?php

namespace App\Domains\Reception\Adapters;

use App\Domains\Billing\Repositories\InvoiceRepository;

class BillingAdapter
{
    public function __construct(private InvoiceRepository $invoiceRepository)
    {
    }

    public function getInvoiceNo($invoice): string
    {
        return $this->invoiceRepository->getInvoiceNo($invoice);
    }
}
