<?php

namespace App\Http\Controllers\Billing;

use App\Domains\Billing\Exports\InvoicesExport;
use App\Domains\Billing\Services\InvoiceService;
use App\Http\Controllers\Controller;
use Carbon\Carbon;
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
        $filters = $request->get("filters", []);
        if (empty($filters["date"]) && empty($filters["from_date"]) && empty($filters["to_date"])) {
            $request->merge([
                "filters" => array_merge($filters, [
                    "from_date" => Carbon::now("Asia/Muscat")->subMonths(3)->startOfDay()->toDateString(),
                    "to_date" => Carbon::now("Asia/Muscat")->toDateString(),
                ])
            ]);
        }
        $invoices= $this->invoiceService->listAllInvoices($request->all());
        return Excel::download(new InvoicesExport($invoices), 'invoices.xlsx');
    }
}
