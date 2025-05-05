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
    public function __invoke(Report $report,PublishReportRequest $request)
    {
        $user = auth()->user();

        $this->reportService->unPublishReport($report);

        return redirect()->back()->with([
            "success" => true,
            "status" => "Report successfully unpublished"
        ]);
    }
}
