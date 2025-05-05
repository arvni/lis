<?php

namespace App\Http\Controllers\Document;

use App\Domains\Document\Services\DocumentService;
use App\Domains\Reception\Models\Report;
use App\Domains\Reception\Services\BuildWordFileService;
use App\Domains\Reception\Services\ReportService;
use App\Http\Controllers\Controller;
use Illuminate\Http\Client\ConnectionException;
use PhpOffice\PhpWord\Exception\Exception;

class DownloadReportController extends Controller
{
    public function __construct(
        private readonly ReportService        $reportService,
        private readonly BuildWordFileService $buildWordFileService,
    )
    {
    }

    /**
     * Handle the incoming request.
     */
    public function __invoke(Report $report)
    {
        $this->authorize("view", $report);
        abort_if(!$report->status, 400, "Report is Rejected");
        $data = $this->reportService->getReportData($report);
        $report->load(["reportedDocument","reportTemplate.template"]);
        $reportedDoc = $report->reportedDocument;
        if (!$reportedDoc)
            $reportedDoc=$report->reportTemplate->template;
        try {
            $docAddr=$this->buildWordFileService->build($reportedDoc->path, $data);
            return response()->download($docAddr)->deleteFileAfterSend();
        } catch (ConnectionException $e) {
        } catch (Exception $e) {
            return back()->with(["success" => false, "status" => $e->getMessage()]);
        }
    }
}
