<?php

declare(strict_types=1);

namespace App\Domains\Reception\Adapters;

use App\Domains\Billing\Models\Invoice;
use App\Domains\Billing\Repositories\InvoiceRepository;
use App\Domains\Billing\Services\InvoiceComposer;
use App\Domains\Billing\Services\InvoiceService;

class BillingAdapter
{
    public function __construct(
        private InvoiceRepository $invoiceRepository,
        private InvoiceService $invoiceService,
        private InvoiceComposer $invoiceComposer,
    ) {}

    public function getInvoiceNo(Invoice $invoice): string
    {
        return $this->invoiceRepository->getInvoiceNo($invoice);
    }

    public function findInvoiceById(int|string $id): ?Invoice
    {
        return $this->invoiceService->findInvoiceById($id);
    }

    public function recomposeInvoice(Invoice $invoice, bool $force = false): int
    {
        return $this->invoiceComposer->recompose($invoice, $force);
    }
}
