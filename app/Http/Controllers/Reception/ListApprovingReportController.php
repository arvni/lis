<?php

namespace App\Http\Controllers\Reception;

use App\Domains\Reception\Models\Report;
use App\Domains\Reception\Requests\ListApprovingReportRequest;
use App\Domains\Reception\Services\ReportService;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class ListApprovingReportController extends Controller
{
    public function __construct(
        private readonly ReportService $reportService,
    )
    {
        $this->middleware("indexProvider");
    }

    public function __invoke(ListApprovingReportRequest $request)
    {
        $requestInputs = $request->all();
        $reports = $this->reportService->listWaitingForApprovalReports($requestInputs);
        $canEdit = Gate::allows("edit", new Report());
        return Inertia::render('Report/Approving', compact("reports", "requestInputs", "canEdit"));
    }
}
