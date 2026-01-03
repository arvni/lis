<?php

namespace App\Http\Controllers\Reception;

use App\Domains\Document\Enums\DocumentTag;
use App\Domains\Document\Services\DocumentService;
use App\Domains\Reception\Models\Report;
use App\Domains\Reception\Requests\StoreReportRequest;
use App\Domains\Reception\Requests\UpdateReportRequest;
use App\Domains\Reception\Services\AcceptanceItemService;
use App\Domains\Reception\Services\AcceptanceService;
use App\Domains\Reception\Services\ReportService;
use App\Domains\Setting\Repositories\SettingRepository;
use App\Http\Controllers\Controller;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    public function __construct(
        private readonly ReportService         $reportService,
        private readonly AcceptanceItemService $acceptanceItemService,
        private readonly AcceptanceService     $acceptanceService,
        private readonly SettingRepository     $settingRepository,
        private readonly DocumentService       $documentService,
    )
    {
        $this->middleware("indexProvider")->only("index");
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $requestInputs = $request->all();
        $reports = $this->reportService->listReports($requestInputs);
        return Inertia::render('Report/Index', compact("reports", "requestInputs"));
    }


    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreReportRequest $request): RedirectResponse
    {
        $user = auth()->user();
        $parameters = $request->get('parameters', []);
        if ($parameters && count($parameters) > 0) {
            foreach (($request->file("parameters") ?? []) as $parameter => $value) {
                $doc = $this->documentService->storeDocument("patient", $request->get("patient_id"), $value, DocumentTag::IMAGE->value);
                $parameters[$parameter] = $doc;
            }
        } else {
            $doc = $this->documentService->getDocument($request->input("reported_document.id"));
        }


        $report = $this->reportService->createReport(
            $user,
            $request->get('acceptance_item_id'),
            $request->input('report_template.id'),
            $request->get('reported_document'),
            $parameters,
            $request->get('files', []),
        );

        // Check and update acceptance status
        $report->loadMissing('acceptanceItem.acceptance');
        if ($report->acceptanceItem && $report->acceptanceItem->acceptance) {
            $this->acceptanceService->checkAndUpdateAcceptanceStatus($report->acceptanceItem->acceptance);
        }

        return redirect()->route('reports.show', $report);
    }

    /**
     * Display the specified resource.
     */
    public function show(Report $report)
    {
//        $this->authorize("view", $report);

        // Load report with all related data
        $loadedReport = $this->reportService->loadReportWithAllRelations($report);

        // Get report history
        $history = $this->acceptanceItemService->getReportHistory($report->acceptance_item_id);

        // Get clinical comment template URL from settings
        $clinicalCommentTemplateUrl = $this->settingRepository->getSettingsByClassAndKey('Report', 'clinicalReport');

        return Inertia::render('Report/Show', [
            "report" => $loadedReport,
            "history" => $history,
            "signers" => $loadedReport->Signers,
            "clinicalCommentTemplateUrl" => $clinicalCommentTemplateUrl,
            "canApprove" => Gate::allows("approve", $report),
            "canEdit" => Gate::allows("update", $report),
            "canPrint" => Gate::allows("print", $report),
            "canPublish" => Gate::allows("publish", $report),
            "canUnpublish" => Gate::allows("unpublish", $report),
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     * @throws AuthorizationException
     */
    public function edit(Report $report): Response|RedirectResponse
    {
        $this->authorize("update", $report);

        // Check if the report is editable
        if (!$this->reportService->isReportEditable($report)) {
            return redirect()->back()->withErrors("The approved/rejected Report Cannot be changed");
        }

        // Load report data
        $reportData = $this->reportService->prepareReportForEditing($report);

        // Get related history
        $history = $this->reportService->getHistoryByAcceptanceItemId($report->acceptance_item_id);

        // Format document files
        $files = $this->reportService->formatDocumentFiles($reportData->documents);
        $reportData->files = $files;

        // Get template URL
        $templates = $this->reportService->getTemplates($reportData->acceptanceItem);
        $data=$reportData->toArray();
        if (count($reportData->parameters)) {
            $data["parameters"] = $this->convertParameters($reportData->parameters);
        }

        return Inertia::render('Report/Edit', [
            "templates" => $templates,
            "report" => $data,
            "signers" => $reportData->signers,
            "acceptanceItem" => $reportData->acceptanceItem,
            "history" => $history,
            "patients" => $reportData->acceptanceItem->patients,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateReportRequest $request, Report $report)
    {
        $user = auth()->user();
        $parameters = $request->get('parameters', []);
        if ($parameters && count($parameters) > 0) {
            if ($parameters && count($parameters) > 0) {
                foreach (($request->file("parameters") ?? []) as $parameter => $value) {
                    $doc = $this->documentService->storeDocument("patient", $request->get("patient_id"), $value, DocumentTag::IMAGE->value);
                    $parameters[$parameter] = $doc;
                }
            }
        } else {

            $doc = $this->documentService->getDocument($request->input("reported_document.id"));
        }

        $report = $this->reportService->updateReport(
            $report,
            $user,
            $request->get('acceptance_item_id'),
            $request->input('report_template.id'),
            $request->get('reported_document'),
            $parameters,
            $request->get('files', []),
        );

        // Check and update acceptance status
        $report->loadMissing('acceptanceItem.acceptance');
        if ($report->acceptanceItem && $report->acceptanceItem->acceptance) {
            $this->acceptanceService->checkAndUpdateAcceptanceStatus($report->acceptanceItem->acceptance);
        }

        return redirect()->route('reports.show', $report);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Report $report)
    {

    }

    private function convertParameters(Collection $parameters)
    {
        $output = [];
        foreach ($parameters->sortByDesc("created_at") as $parameter) {
            $slug = strtolower(preg_replace('/\s+/', '_', $parameter->parameter->title));

            // Concatenate with parameter ID
            $output[$slug . '_' . $parameter->parameter_id] = $parameter["value"];
        }
        return $output;
    }
}
