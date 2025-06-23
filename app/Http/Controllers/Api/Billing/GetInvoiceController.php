<?php

namespace App\Http\Controllers\Api\Billing;

use App\Domains\Billing\Models\Invoice;
use App\Http\Controllers\Controller;
use App\Http\Resources\InvoiceResource;
use Illuminate\Http\Request;

class GetInvoiceController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(Invoice $invoice, Request $request)
    {
        $invoice->load("owner","patient","acceptance","referrer");
        return new InvoiceResource($invoice);
    }
}
