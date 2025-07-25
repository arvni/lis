<?php

namespace App\Domains\Billing\Services;


use App\Domains\Billing\Adapters\ReceptionAdapter;
use App\Domains\Billing\DTOs\InvoiceDTO;
use App\Domains\Billing\Enums\InvoiceStatus;
use App\Domains\Billing\Enums\PaymentMethod;
use App\Domains\Billing\Models\Invoice;
use App\Domains\Billing\Models\Statement;
use App\Domains\Billing\Repositories\InvoiceRepository;
use App\Domains\Laboratory\Enums\TestType;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Arr;

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
        $output=$invoice->toArray();

        $output["acceptance_items"]= Arr::flatten(
                array_values(
                    $invoice->acceptanceItems
                        ->groupBy("test.type")
                        ->map(function ($item,$key) {
            if ($key!==TestType::PANEL->value)
                return $item;
            else
                return array_values($item
                    ->groupBy("panel_id")
                    ->map(function ($item,$key) {
                    return collect([
                        "id"=>$key,
                        "price"=>$item->sum("price"),
                        "discount"=>$item->sum("discount"),
                        "test"=>$item->first()->test,
                        "items"=>$item
                    ]);
                })->toArray());
        })
                        ->toArray()
                )
                ,1);
        return $output;
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
            $paidByCredit = $invoice->payments()->where("paymentMethod", PaymentMethod::CREDIT)->count() > 0;
            $this->invoiceRepository->updateInvoice($invoice, ["status" => $paidByCredit ? InvoiceStatus::CREDIT_PAID : InvoiceStatus::PAID]);
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

    public function updateInvoicesStatementID(Statement $statement, $invoices)
    {
        $statement->loadMissing("invoices");
        $this->invoiceRepository->updateMany(Arr::pluck($invoices, "id"), $statement);
    }


}
