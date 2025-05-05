<?php

namespace App\Http\Controllers\Reception;

use App\Domains\Reception\Models\AcceptanceItem;
use App\Domains\Reception\Services\AcceptanceItemService;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ListAcceptanceItemReadyReportController extends Controller
{
    public function __construct(private AcceptanceItemService $acceptanceItemService)
    {
        $this->middleware("indexProvider");
    }

    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request)
    {
        $requestInputs = $request->all();
        $acceptanceItems=$this->acceptanceItemService->listAcceptanceItemsReadyReport($requestInputs);
        return Inertia::render("Report/Waiting", compact("acceptanceItems","requestInputs"));
    }
}
