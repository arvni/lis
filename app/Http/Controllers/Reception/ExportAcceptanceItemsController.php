<?php

namespace App\Http\Controllers\Reception;

use App\Domains\Reception\Exports\AcceptanceItemsExport;
use App\Domains\Reception\Services\AcceptanceItemService;
use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;

class ExportAcceptanceItemsController extends Controller
{
    public function __construct(private readonly AcceptanceItemService $acceptanceItemService)
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
        $acceptanceItems=$this->acceptanceItemService->exportAcceptanceItems($request->all());
        return Excel::download(new AcceptanceItemsExport($acceptanceItems), 'statistics.xlsx');
    }
}
