<?php

namespace App\Http\Controllers\Reception;

use App\Domains\Reception\Adapters\LaboratoryAdapter;
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
    private LaboratoryAdapter $laboratoryAdapter;

    public function __construct(
        ReportService $reportService,
        AcceptanceItemRepository $acceptanceItemRepository,
        ReportRepository $reportRepository,
        LaboratoryAdapter $laboratoryAdapter
    ) {
        $this->reportService = $reportService;
        $this->acceptanceItemRepository = $acceptanceItemRepository;
        $this->reportRepository = $reportRepository;
        $this->laboratoryAdapter = $laboratoryAdapter;
    }

    public function __invoke(AcceptanceItem $acceptanceItem): \Illuminate\Http\RedirectResponse|\Inertia\Response
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

        // Get laboratory data through the cross-domain adapter
        $method = $this->laboratoryAdapter->getMethodForAcceptanceItem($acceptanceItem);
        $test = $this->laboratoryAdapter->getTestForAcceptanceItem($acceptanceItem);

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
