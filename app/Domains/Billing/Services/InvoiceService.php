<?php

namespace App\Domains\Billing\Services;

use Illuminate\Database\Eloquent\Collection;


use App\Domains\Billing\DTOs\InvoiceDTO;
use App\Domains\Billing\Enums\InvoiceStatus;
use App\Domains\Billing\Enums\PaymentMethod;
use App\Domains\Billing\Models\Invoice;
use App\Domains\Billing\Models\InvoiceItem;
use App\Domains\Billing\Models\Statement;
use App\Domains\Billing\Repositories\InvoiceRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Arr;

readonly class InvoiceService
{
    public function __construct(
        private InvoiceRepository $invoiceRepository,
        private InvoiceComposer $invoiceComposer,
    )
    {
    }

    public function listInvoices(array $queryData): LengthAwarePaginator
    {
        return $this->invoiceRepository->listInvoices($queryData);
    }

    public function listAllInvoices(array $queryData): Collection
    {
        return $this->invoiceRepository->listAllInvoices($queryData);
    }

    public function storeInvoice(InvoiceDTO $invoiceDTO): Invoice
    {
        return $this->invoiceRepository->creatInvoice($invoiceDTO->toArray());
    }

    /** @return array<string, mixed> */
    public function loadForShow(Invoice $invoice): array
    {
        $this->invoiceComposer->recompose($invoice);

        $invoice->load([
            "patientPayments.cashier",
            "acceptance.patient",
            "acceptance.referrerOrders",
            "invoiceItems.test",
            "owner",
            "payments.payer",
        ])
            ->loadSum("payments", "price")
            ->loadSum("patientPayments", "price")
            ->loadSum("sponsorPayments", "price")
            ->loadSum("invoiceItems", "discount")
            ->loadSum("invoiceItems", "price");

        $invoice->invoiceNo = $this->invoiceRepository->getInvoiceNo($invoice);
        $invoice->has_different_owner = $invoice->owner_type === "referrer";

        $output = $invoice->toArray();
        $output["acceptance_items"] = $invoice->invoiceItems
            ->map(fn(InvoiceItem $item) => $this->presentInvoiceItem($item))
            ->values()
            ->toArray();

        // Frontend reads acceptance_items_sum_*; keep those aliases pointing at the new totals.
        $output["acceptance_items_sum_price"] = $output["invoice_items_sum_price"] ?? 0;
        $output["acceptance_items_sum_discount"] = $output["invoice_items_sum_discount"] ?? 0;

        return $output;
    }

    private function presentInvoiceItem(InvoiceItem $item): array
    {
        $test = $item->test;
        return [
            "id"               => $item->id,
            "kind"             => $item->kind?->value,
            "test"             => $test ? [
                "id"        => $test->id,
                "name"      => $test->name,
                "fullName"  => $test->fullName,
                "code"      => $test->code,
                "can_merge" => (bool) $test->can_merge,
                "type"      => $test->type?->value,
            ] : null,
            "title"            => $item->title,
            "code"             => $item->code,
            "description"      => $item->description,
            "qty"              => $item->qty,
            "unit_price"       => (float) $item->unit_price,
            "price"            => (float) $item->price,
            "discount"         => (float) $item->discount,
            "customParameters" => $item->customParameters,
            "panel_id"         => $item->panel_id,
            "acceptance_id"    => $item->acceptance_id,
            "locked"           => $item->isLocked(),
        ];
    }

    public function updateInvoice(Invoice $invoice, InvoiceDTO $invoiceDTO): Invoice
    {
        return $this->invoiceRepository->updateInvoice($invoice, $invoiceDTO->toArray());
    }

    public function findInvoiceById(int|string $id): ?Invoice
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
            $paidByCredit = $invoice->payments()->where("paymentMethod", PaymentMethod::CREDIT)->count() > 0;
            $this->invoiceRepository->updateInvoice($invoice, ["status" => $paidByCredit ? InvoiceStatus::CREDIT_PAID : InvoiceStatus::PAID]);
        } elseif ($invoice->isPartiallyPaid()) {
            $invoice->update(["status" => InvoiceStatus::PARTIALLY_PAID]);
        } else
            $invoice->update(["status" => InvoiceStatus::WAITING_FOR_PAYMENT]);
    }

    public function updateInvoicesStatementID(Statement $statement, array $invoices): void
    {
        $statement->loadMissing("invoices");
        $this->invoiceRepository->updateMany(Arr::pluck($invoices, "id"), $statement);
    }


}
