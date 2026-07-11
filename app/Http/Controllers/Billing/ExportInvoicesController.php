<?php

namespace App\Http\Controllers\Billing;

use App\Domains\Billing\Exports\InvoicesExport;
use App\Domains\Billing\Requests\ExportInvoicesRequest;
use App\Domains\Billing\Services\InvoiceService;
use App\Http\Controllers\Controller;
use Maatwebsite\Excel\Facades\Excel;


class ExportInvoicesController extends Controller
{
    public function __construct(private readonly InvoiceService $invoiceService)
    {
        $this->middleware("indexProvider");
    }

    public function __invoke(ExportInvoicesRequest $request): \Symfony\Component\HttpFoundation\BinaryFileResponse
    {
        $filters = $request->get("filters", []);
        if (empty($filters["date"]) && empty($filters["from_date"]) && empty($filters["to_date"])) {
            $request->merge([
                "filters" => array_merge($filters, [
                    "from_date" => now()->subMonths(3)->startOfDay()->toDateString(),
                    "to_date" => now()->toDateString(),
                ])
            ]);
        }
        $invoices= $this->invoiceService->listAllInvoices($request->all());
        return Excel::download(new InvoicesExport($invoices), 'invoices.xlsx');
    }
}
