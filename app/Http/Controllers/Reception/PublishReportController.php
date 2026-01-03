<?php

namespace App\Http\Controllers\Reception;

use App\Domains\Reception\Models\Report;
use App\Domains\Reception\Requests\PublishReportRequest;
use App\Domains\Reception\Services\ReportService;
use App\Http\Controllers\Controller;

class PublishReportController extends Controller
{
    public function __construct(private readonly ReportService $reportService)
    {
    }

    /**
     * Handle the incoming request.
     */
    public function __invoke(Report $report, PublishReportRequest $request)
    {
        if (!$report->status)
            return back()->withErrors("this report has been rejected before");
        if (!$report->approver_id)
            return back()->withErrors("this report need to be approved before");
        if ($report->publisher_id)
            return back()->withErrors("this report published before");
        $user = auth()->user();
        $this->reportService->publishReport($report, $user,$request->input("silently_publish",false));

        return redirect()->back()->with([
            "success" => true,
            "status" => "Report successfully published"
        ]);
    }
}
