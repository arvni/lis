<?php

namespace App\Domains\Billing\Services;


use App\Domains\Billing\Adapters\ReceptionAdapter;
use App\Domains\Billing\DTOs\InvoiceDTO;
use App\Domains\Billing\Enums\InvoiceStatus;
use App\Domains\Billing\Models\Invoice;
use App\Domains\Billing\Repositories\InvoiceRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

readonly class InvoiceService
{
    public function __construct(
        private InvoiceRepository $invoiceRepository,
        private ReceptionAdapter  $receptionAdapter,
    )
    {
    }

    public function listInvoices($queryData): LengthAwarePaginator
    {
        return $this->invoiceRepository->listInvoices($queryData);
    }

    public function listAllInvoices($queryData)
    {
        return $this->invoiceRepository->listAllInvoices($queryData);
    }

    public function storeInvoice(InvoiceDTO $invoiceDTO): Invoice
    {
        return $this->invoiceRepository->creatInvoice($invoiceDTO->toArray());
    }

    public function loadForShow(Invoice $invoice)
    {
        $invoice->load([
            "patientPayments.cashier",
            "acceptance.patient",
            "acceptance.referrerOrder",
            "acceptanceItems.method",
            "acceptanceItems.test",
            "acceptanceItems.patients",
            "owner",
            "payments.payer"
        ])
            ->loadSum("payments", "price")
            ->loadSum("patientPayments", "price")
            ->loadSum("sponsorPayments", "price")
            ->loadSum("acceptanceItems", "discount")
            ->loadSum("acceptanceItems", "price");

        $invoice->invoiceNo = $this->invoiceRepository->getInvoiceNo($invoice);
        $invoice->has_different_owner = $invoice->owner_type === "referrer";
        return $invoice;
    }

    public function updateInvoice(Invoice $invoice, InvoiceDTO $invoiceDTO): Invoice
    {
        return $this->invoiceRepository->updateInvoice($invoice, $invoiceDTO->toArray());
    }

    public function findInvoiceById($id): ?Invoice
    {
        return $this->invoiceRepository->findInvoiceById($id);
    }

    public function deleteInvoice(Invoice $invoice): void
    {
        $this->invoiceRepository->deleteInvoice($invoice);
    }

    public function updateStatus(Invoice $invoice): void
    {
        if ($invoice->isPaid()) {
            $this->invoiceRepository->updateInvoice($invoice, ["status" => InvoiceStatus::PAID]);
        } elseif ($invoice->isPartiallyPaid()) {
            $invoice->update(["status" => InvoiceStatus::PARTIALLY_PAID]);
        } else
            $invoice->update(["status" => InvoiceStatus::WAITING_FOR_PAYMENT]);
    }

    public function updateInvoiceItems($items): void
    {
        foreach ($items as $item) {
            $this->receptionAdapter->updateAcceptanceItem($item);
        }
    }


}
