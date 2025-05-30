<?php

namespace App\Http\Controllers\Reception;

use App\Domains\Reception\Models\Report;
use App\Domains\Reception\Services\ReportService;
use App\Http\Controllers\Controller;
use App\Http\Requests\RejectReportRequest;


class RejectReportController extends Controller
{
    public function __construct(private readonly ReportService $reportService)
    {
    }

    /**
     * Handle the incoming request.
     */
    public function __invoke(Report $report, RejectReportRequest $request)
    {
        $user = auth()->user();
        $this->reportService->rejectReport($report, $user, $request->validated("comment"));

        return back()->with(["success" => true, "status" => "Report rejected successfully"]);
    }
}
