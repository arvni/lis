<?php

namespace App\Http\Controllers\Api\Billing;

use App\Domains\Billing\Models\Invoice;
use App\Domains\Laboratory\Enums\TestType;
use App\Http\Controllers\Controller;
use App\Http\Resources\InvoiceResource;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class GetInvoiceController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(Invoice $invoice, Request $request)
    {
        $invoice->load(
            [
                "owner",
                "patient",
                "acceptance",
                "acceptanceItems" => function ($q) {
                    $q->with([
                        "patients",
                        "methodTest.method",
                        "methodTest.test",
                    ]);
                },
                "referrer",
                "payments.payer",
                "payments.cashier",
            ]);

        return new InvoiceResource($invoice);
    }
}
