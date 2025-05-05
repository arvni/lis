<?php

namespace App\Http\Controllers\Reception;

use App\Domains\Reception\Exports\AcceptanceItemsExport;
use App\Domains\Reception\Services\AcceptanceItemService;
use App\Http\Controllers\Controller;
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
        $acceptanceItems=$this->acceptanceItemService->exportAcceptanceItems($request->all());
        return Excel::download(new AcceptanceItemsExport($acceptanceItems), 'statistics.xlsx');
    }
}
