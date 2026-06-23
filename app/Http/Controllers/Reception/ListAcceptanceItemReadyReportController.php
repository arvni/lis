<?php

namespace App\Http\Controllers\Reception;

use App\Domains\Reception\Requests\ListAcceptanceItemReadyReportRequest;
use App\Domains\Reception\Services\AcceptanceItemService;
use App\Http\Controllers\Controller;
use Inertia\Inertia;

class ListAcceptanceItemReadyReportController extends Controller
{
    public function __construct(private AcceptanceItemService $acceptanceItemService)
    {
        $this->middleware("indexProvider");
    }

    public function __invoke(ListAcceptanceItemReadyReportRequest $request): \Inertia\Response
    {
        $requestInputs = $request->all();
        $acceptanceItems=$this->acceptanceItemService->listAcceptanceItemsReadyReport($requestInputs);
        return Inertia::render("Report/Waiting", compact("acceptanceItems","requestInputs"));
    }
}
