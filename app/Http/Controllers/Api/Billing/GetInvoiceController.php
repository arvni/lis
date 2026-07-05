<?php

namespace App\Http\Controllers\Api\Billing;

use App\Domains\Billing\Models\Invoice;
use App\Domains\Billing\Services\InvoiceComposer;
use App\Http\Controllers\Controller;
use App\Http\Resources\InvoiceResource;
use Illuminate\Http\Request;

class GetInvoiceController extends Controller
{
    public function __invoke(Invoice $invoice, Request $request, InvoiceComposer $composer): \Illuminate\Http\Resources\Json\JsonResource
    {
        $this->authorize("view", $invoice);

        // Ensure invoice_items reflect the latest acceptance_items before exposing them.
        $composer->recompose($invoice);

        $invoice->load([
            "owner",
            "patient",
            "acceptance",
            "invoiceItems.test",
            "referrer",
            "payments.payer",
            "payments.cashier",
        ]);

        return new InvoiceResource($invoice);
    }
}
