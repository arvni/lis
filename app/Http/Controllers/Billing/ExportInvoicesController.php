<?php

namespace App\Http\Controllers\Billing;

use App\Domains\Billing\Exports\InvoicesExport;
use App\Domains\Billing\Services\InvoiceService;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;


class ExportInvoicesController extends Controller
{
    public function __construct(private readonly InvoiceService $invoiceService)
    {
        $this->middleware("indexProvider");
    }

    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request)
    {
        $invoices= $this->invoiceService->listAllInvoices($request->all());
        return Excel::download(new InvoicesExport($invoices), 'invoices.xlsx');
    }
}
