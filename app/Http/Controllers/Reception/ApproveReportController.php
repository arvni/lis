<?php

namespace App\Http\Controllers\Reception;

use App\Domains\Reception\Models\Report;
use App\Domains\Reception\Requests\ApproveReportRequest;
use App\Domains\Reception\Services\ReportService;
use App\Http\Controllers\Controller;

class ApproveReportController extends Controller
{
    public function __construct(private readonly ReportService $reportService)
    {
    }

    /**
     * Handle the incoming request.
     */
    public function __invoke(Report $report, ApproveReportRequest $request)
    {
        $this->authorize('approve', $report);

        $user = auth()->user();

        // Process the approval
        $this->reportService->approveReport(
            $report,
            $user,
            $request->get('published_report_document'),
            $request->get('clinical_comment_document'),
        );

        return back()->with(["success"=>true, "status" => "Report approved successfully"]);
    }
}
