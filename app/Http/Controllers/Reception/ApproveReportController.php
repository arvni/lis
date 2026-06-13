<?php

namespace App\Http\Controllers\Reception;

use App\Domains\Reception\Enums\ReportApprovalStatus;
use App\Domains\Reception\Models\Report;
use App\Domains\Reception\Requests\ApproveReportRequest;
use App\Domains\Reception\Services\AcceptanceService;
use App\Domains\Reception\Services\ReportApprovalService;
use App\Http\Controllers\Controller;

class ApproveReportController extends Controller
{
    public function __construct(
        private readonly ReportApprovalService $reportApprovalService,
        private readonly AcceptanceService $acceptanceService
    )
    {
    }

    /**
     * Handle the incoming request.
     */
    public function __invoke(Report $report, ApproveReportRequest $request)
    {
        $this->authorize('approve', $report);

        if (!$report->status)
            return back()->withErrors("this report has been rejected before");
        if ($report->approver_id)
            return back()->withErrors("this report has already been approved");

        $user = auth()->user();

        // Process the approval (advances the flow, or completes it on the final step)
        $report = $this->reportApprovalService->approve(
            $report,
            $user,
            $request->get('published_report_document'),
            $request->get('clinical_comment_document'),
            $request->get('comment'),
        );

        if ($report->approval_status !== ReportApprovalStatus::APPROVED) {
            return back()->with(["success" => true, "status" => "Approval recorded; report is waiting for the next approval step"]);
        }

        // Check and update acceptance status
        $report->loadMissing('acceptanceItem.acceptance');
        if ($report->acceptanceItem && $report->acceptanceItem->acceptance) {
            $this->acceptanceService->checkAndUpdateAcceptanceStatus($report->acceptanceItem->acceptance);
        }

        return back()->with(["success"=>true, "status" => "Report approved successfully"]);
    }
}
