<?php

namespace App\Http\Controllers\Reception;

use App\Domains\Reception\Models\AcceptanceItem;
use App\Domains\Reception\Models\Report;
use App\Domains\Reception\Repositories\AcceptanceItemRepository;
use App\Domains\Reception\Repositories\ReportRepository;
use App\Domains\Reception\Services\ReportService;
use App\Http\Controllers\Controller;
use App\Http\Resources\ReportResource;
use Inertia\Inertia;

class CreateReportController extends Controller
{
    private ReportService $reportService;
    private AcceptanceItemRepository $acceptanceItemRepository;
    private ReportRepository $reportRepository;

    public function __construct(
        ReportService $reportService,
        AcceptanceItemRepository $acceptanceItemRepository,
        ReportRepository $reportRepository
    ) {
        $this->reportService = $reportService;
        $this->acceptanceItemRepository = $acceptanceItemRepository;
        $this->reportRepository = $reportRepository;
    }

    public function __invoke(AcceptanceItem $acceptanceItem)
    {
        $this->authorize("create", [Report::class, $acceptanceItem]);

        // Check if report already exists and redirect to it
        if ($this->reportService->hasReport($acceptanceItem)) {
            $acceptanceItem->load("report");
            return redirect()->route("reports.show", $acceptanceItem->report->id)
                ->with(["info" => "This test already has a report. Redirected to existing report."]);
        }

        // Load all required data using repository
        $acceptanceItemData = $this->acceptanceItemRepository->getWithReportingDetails($acceptanceItem);

        // Get laboratory data through the domain service with adapter
        $method = $this->reportService->getMethod($acceptanceItem);
        $test = $this->reportService->getTest($acceptanceItem);

        // Get template URL through adapter
        $templates = $this->reportService->getTemplates($acceptanceItem);

        // Get report history for this acceptance item
        $history = $this->reportRepository->getHistoryForAcceptanceItem($acceptanceItemData);

        $data = [
            "templates" => $templates,
            "history" => ReportResource::collection($history),
            "acceptanceItem" => $acceptanceItemData,
            "patients" => $acceptanceItemData->patients,
            "method" => $method,
            "test" => $test,
        ];

        return Inertia::render('Report/Add', $data);
    }
}
