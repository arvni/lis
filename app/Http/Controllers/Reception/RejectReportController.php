<?php

namespace App\Http\Controllers\Reception;

use App\Domains\Reception\Models\Report;
use App\Domains\Reception\Services\ReportApprovalService;
use App\Http\Controllers\Controller;
use App\Domains\Reception\Requests\RejectReportRequest;


class RejectReportController extends Controller
{
    public function __construct(private readonly ReportApprovalService $reportApprovalService)
    {
    }

    /**
     * Handle the incoming request.
     */
    public function __invoke(Report $report, RejectReportRequest $request): \Illuminate\Http\RedirectResponse
    {
        if (!$report->status)
            return back()->withErrors("this report has been rejected before");
        if ($report->approver_id)
            return back()->withErrors("this report has already been approved");

        $user = auth()->user();
        $this->reportApprovalService->reject($report, $user, $request->validated("comment"));

        return back()->with(["success" => true, "status" => "Report rejected successfully"]);
    }
}
