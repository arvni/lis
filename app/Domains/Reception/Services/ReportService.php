<?php

namespace App\Domains\Reception\Services;

use App\Domains\Document\Enums\DocumentTag;
use App\Domains\Reception\Adapters\DocumentAdapter;
use App\Domains\Reception\Adapters\LaboratoryAdapter;
use App\Domains\Reception\Enums\ReportApprovalStatus;
use App\Domains\Reception\Events\PatientDocumentUpdateEvent;
use App\Domains\Reception\Events\ReportPublishedEvent;
use App\Domains\Reception\Factories\SignerFactory;
use App\Domains\Reception\Models\AcceptanceItem;
use App\Domains\Reception\Models\Report;
use App\Domains\Reception\Repositories\AcceptanceItemRepository;
use App\Domains\Reception\Repositories\ReportParameterRepository;
use App\Domains\Reception\Repositories\ReportRepository;
use App\Domains\Reception\Repositories\SignerRepository;
use App\Domains\User\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\UploadedFile;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use PhpOffice\PhpWord\Exception\Exception;

class ReportService
{

    private LaboratoryAdapter $laboratoryService;
    private ReportRepository $reportRepository;
    private AcceptanceItemRepository $acceptanceItemRepository;
    private AcceptanceItemService $acceptanceItemService;
    private SignerRepository $signerRepository;
    private SignerFactory $signerFactory;
    private ReportParameterRepository $reportParameterRepository;

    public function __construct(
        LaboratoryAdapter                     $laboratoryService,
        ReportRepository                      $reportRepository,
        AcceptanceItemRepository              $acceptanceItemRepository,
        AcceptanceItemService                 $acceptanceItemService,
        SignerRepository                      $signerRepository,
        SignerFactory                         $signerFactory,
        ReportParameterRepository             $reportParameterRepository,
        private readonly DocumentAdapter      $documentAdapter,
        private readonly BuildWordFileService $buildWordFileService,
        private readonly ReportDataService    $reportDataService,
    )
    {
        $this->laboratoryService = $laboratoryService;
        $this->reportRepository = $reportRepository;
        $this->acceptanceItemRepository = $acceptanceItemRepository;
        $this->acceptanceItemService = $acceptanceItemService;
        $this->signerRepository = $signerRepository;
        $this->signerFactory = $signerFactory;
        $this->reportParameterRepository = $reportParameterRepository;

    }

    /**
     * @return LengthAwarePaginator<int, Report>
     */
    public function listReports(array $queryData): LengthAwarePaginator
    {
        return $this->reportRepository->list($queryData);
    }

    public function listWaitingForApprovalReports(array $queryData): LengthAwarePaginator
    {
        return $this->reportRepository->listWaitingForApproving($queryData);
    }

    public function listWaitingForPublishReports(array $queryData): LengthAwarePaginator
    {
        return $this->reportRepository->listWaitingForPublish($queryData);
    }

    public function getHistoryForAcceptanceItem(AcceptanceItem $acceptanceItem): Collection
    {
        return $this->reportRepository->getHistoryForAcceptanceItem($acceptanceItem);
    }

    /**
     * @throws Exception
     * @throws ConnectionException
     */
    public function createReport(User   $user,
                                 int    $acceptanceItemId,
                                 int    $reportTemplateId,
                                 ?array $reportedDocument = null,
                                 array  $parameters = [],
                                 ?array $additionalFiles = []): Report
    {
        // Get acceptance item
        $acceptanceItem = $this->acceptanceItemRepository->findAcceptanceItemById($acceptanceItemId);

        // Create report
        $report = $this->reportRepository->create([
            'reported_at' => Carbon::now("Asia/Muscat"),
            'reporter_id' => $user->id,
            'acceptance_item_id' => $acceptanceItemId,
            'report_template_id' => $reportTemplateId,
        ]);
        // Create signer
        $signer = $this->signerFactory->createFromUser($user, $report);
        $this->signerRepository->save($signer);
        $report->load("reportTemplate.template", "acceptanceItem.patient");

        // Associate additional files
        if (count($additionalFiles)) {
            foreach ($additionalFiles as $file) {
                $this->processDocument($file['id'], $report, DocumentTag::ADDITIONAL);
            }
        }
        if (count($parameters))
            $this->createOrUpdateReportParameters($report, $parameters);
        $this->acceptanceItemService->updateAcceptanceItemTimeline($acceptanceItem, "Report Created By $user->name");

        if (isset($reportedDocument['id']))
            $this->processDocument($reportedDocument['id'], $report, DocumentTag::REPORTED);
        elseif (count($parameters) > 0) {
            $data = $this->getReportData($report);
            $docAddr = $this->buildWordFileService->build($report->reportTemplate->template->path, $data);
            $this->documentAdapter->storeDocument(
                "patient",
                $report->acceptanceItem->patient->id,
                new UploadedFile($docAddr, "Report.docx"),
                DocumentTag::REPORTED->value,
                "report",
                $report->id);
        }

        return $report;
    }

    /**
     * @throws Exception
     * @throws ConnectionException
     */
    public function updateReport(Report $report,
                                 User   $user,
                                 int    $acceptanceItemId,
                                 int    $reportTemplateId,
                                 ?array $reportedDocument = null,
                                 array  $parameters = [],
                                 ?array $additionalFiles = [],
                                 array  $signers = []): Report
    {
        // Get acceptance item
        $acceptanceItem = $this->acceptanceItemRepository->findAcceptanceItemById($acceptanceItemId);

        // Editing invalidates any approvals collected so far: the flow restarts.
        $report->approvals()->delete();

        // Create report
        $report = $this->reportRepository->update($report,
            [
                'reported_at' => Carbon::now("Asia/Muscat"),
                'reporter_id' => $user->id,
                'acceptance_item_id' => $acceptanceItemId,
                'report_template_id' => $reportTemplateId,
                'approver_id' => null,
                'approved_at' => null,
                'approval_status' => ReportApprovalStatus::PENDING,
                'current_step_position' => null,
            ]);
        // Persist signers
        $this->syncSigners($report, $user, $signers);
        $report->load("reportTemplate.template", "acceptanceItem.patient");

        // Associate additional files
        if (count($additionalFiles)) {
            foreach ($additionalFiles as $file) {
                $this->processDocument($file['id'], $report, DocumentTag::ADDITIONAL);
            }
        }
        if (count($parameters))
            $this->createOrUpdateReportParameters($report, $parameters);
        $this->acceptanceItemService->updateAcceptanceItemTimeline($acceptanceItem, "Report Updated By $user->name");

        if (isset($reportedDocument['id']) || isset($reportedDocument['hash']))
            $this->processDocument($reportedDocument['id'] ?? $reportedDocument['hash'], $report, DocumentTag::REPORTED);
        elseif (count($parameters) > 0 && !$report->reportedDocument()->exists()) {
            $data = $this->getReportData($report);
            $docAddr = $this->buildWordFileService->build($report->reportTemplate->template->path, $data);
            $this->documentAdapter->storeDocument(
                "patient",
                $report->acceptanceItem->patient->id,
                new UploadedFile($docAddr, "Report.docx"),
                DocumentTag::REPORTED->value,
                "report",
                $report->id);
        }

        return $report;
    }

    /**
     * Load a report with all its relations needed for display
     *
     * @param Report $report
     * @return Report
     */
    public function loadReportWithAllRelations(Report $report): Report
    {
        return $this->reportRepository->loadWithAllRelations($report);
    }


    /**
     * Check if the acceptance item already has a report
     *
     * @param AcceptanceItem $acceptanceItem
     * @return bool
     */
    public function hasReport(AcceptanceItem $acceptanceItem): bool
    {
        $acceptanceItem->load("report");
        return $acceptanceItem->report !== null;
    }

    /**
     * Get template URL from laboratory domain via adapter
     *
     * @param AcceptanceItem $acceptanceItem
     * @return array
     */
    public function getTemplates(AcceptanceItem $acceptanceItem): array
    {
        $acceptanceItem->load("method.test.reportTemplates");
        return $this->laboratoryService->getTemplateUrl($acceptanceItem->method->test->reportTemplates);
    }

    /**
     * Check if a report is editable
     *
     * @param Report $report
     * @return bool
     */
    public function isReportEditable(Report $report): bool
    {
        $user = auth()->user();

        return (!$report->approver_id && $report->status && $user->id == $report->reporter_id) || Gate::allows('editAll', $report);
    }

    /**
     * Prepare a report for editing by loading all necessary relations
     *
     * @param Report $report
     * @return Report
     */
    public function prepareReportForEditing(Report $report): Report
    {
        return $this->reportRepository->loadForEditing($report);
    }

    /**
     * Format document files for frontend display
     *
     * @param  $documents
     * @return \Illuminate\Support\Collection
     */
    public function formatDocumentFiles(\Illuminate\Support\Collection $documents)
    {
        return $this->reportDataService->formatDocumentFiles($documents);
    }

    /**
     * Approve a report
     *
     * @param Report $report
     * @param User $approver
     * @param array|null $clinicalCommentDocument
     * @return Report
     */
    public function approveReport(
        Report $report,
        User   $approver,
        array $publishedReportDocument,
        ?array $clinicalCommentDocument = null
    ): Report
    {
        // Update report with approval information
        $report = $this->markReportAsApproved($report, $approver);

        $this->processDocument($publishedReportDocument['id'] ?? $publishedReportDocument['hash'], $report, DocumentTag::PUBLISHED);

        // Process clinical comment document if provided
        if ($clinicalCommentDocument && (isset($clinicalCommentDocument['id']) || isset($clinicalCommentDocument['hash']))) {
            $this->processDocument($clinicalCommentDocument['id'] ?? $clinicalCommentDocument['hash'], $report, DocumentTag::CLINICAL_COMMENT);
        }

        // Create approver signer record
        $this->createApproverSignerRecord($report, $approver);

        // Update acceptance item timeline
        $report->loadMissing("acceptanceItem");
        $this->acceptanceItemService->updateAcceptanceItemTimeline($report->acceptanceItem, "Report Approved By $approver->name");
        return $report;
    }

    /**
     * Approve a report
     *
     * @param Report $report
     * @param User $rejecter
     * @param string $comment
     * @return Report
     */
    public function rejectReport(
        Report $report,
        User   $rejecter,
        string $comment
    ): Report
    {
        // Update report with approval information
        $report = $this->markReportAsRejected($report, $rejecter, $comment);

        // Update acceptance item timeline
        $report->loadMissing("acceptanceItem");
        $this->acceptanceItemService->updateAcceptanceItemTimeline($report->acceptanceItem, "Report Rejected By $rejecter->name");

        return $report;
    }


    /**
     * Publish a report
     *
     * @param Report $report
     * @param User $publisher
     * @param bool $silentlyPublish
     * @return Report
     */
    public function publishReport(Report $report, User $publisher, bool $silentlyPublish = false): Report
    {
        // Mark report as published
        $report = $this->markReportAsPublished($report, $publisher);

        // Update acceptance item timeline and check if all tests are published
        $this->processPublishedReport($report, $silentlyPublish);

        return $report;
    }


    /**
     * Unpublish a report
     *
     * @param Report $report
     * @return Report
     */
    public function unPublishReport(Report $report)
    {
        // Mark report as published
        $report = $this->markReportAsUnpublished($report);

        // Update acceptance item timeline and check if all tests are published
        $this->processUnpublishedReport($report);

        $this->deletePublishedDocument($report);

        return $report;
    }

    /**
     * Mark report as approved
     *
     * @param Report $report
     * @param User $approver
     * @return Report
     */
    private function markReportAsApproved(Report $report, User $approver): Report
    {

        return $this->reportRepository->update($report, [
            "approved_at" => Carbon::now("Asia/Muscat"),
            "approver_id" => $approver->id
        ]);
    }

    /**
     * Process clinical comment document
     *
     * @param $documentId
     * @param Report $report
     * @param DocumentTag $documentTag
     * @return void
     */
    private function processDocument(int|string $documentId, Report $report, DocumentTag $documentTag): void
    {
        $report->load("acceptanceItem.patient");
        // Associate main document
        PatientDocumentUpdateEvent::dispatch(
            $documentId,
            $report?->acceptanceItem?->patient?->id,
            $documentTag->value,
            'report',
            $report->id
        );

    }

    /**
     * Delete Published Documents
     *
     * @param Report $report
     * @return void
     */
    private function deletePublishedDocument(Report $report): void
    {
        $report->load("publishedDocument");
        if ($report->publishedDocument) {
            $this->documentAdapter->deleteDocument($report->publishedDocument);
        }

    }

    /**
     * Replace a report's signers with the submitted list.
     *
     * Each submitted signer's name/signature/stamp are sourced from the
     * authoritative User record; the title and row are taken from the request.
     * Falls back to seeding the reporter as the sole signer when none provided.
     *
     * @param Report $report
     * @param User $reporter
     * @param array $signers
     * @return void
     */
    private function syncSigners(Report $report, User $reporter, array $signers): void
    {
        $report->signers()->delete();

        if (empty($signers)) {
            $signer = $this->signerFactory->createFromUser($reporter, $report);
            $this->signerRepository->save($signer);
            return;
        }

        foreach (array_values($signers) as $index => $signerData) {
            $signerUser = User::find($signerData['user_id']);
            if (!$signerUser) {
                continue;
            }

            $row = $signerData['row'] ?? ($index + 1);
            $signer = $this->signerFactory->createFromUser($signerUser, $report, $row);

            if (array_key_exists('title', $signerData) && $signerData['title'] !== null) {
                $signer->title = $signerData['title'];
            }

            $this->signerRepository->save($signer);
        }
    }

    /**
     * Create approver signer record
     *
     * @param Report $report
     * @param User $approver
     * @return void
     */
    private function createApproverSignerRecord(Report $report, User $approver): void
    {
        if (!$report->signers()->where("user_id", $approver->id)->exists()) {
            // Create signer
            $signer = $this->signerFactory->createFromUser($approver, $report);
            $this->signerRepository->save($signer);
        }

    }


    /**
     * Mark report as published
     *
     * @param Report $report
     * @param User $publisher
     * @return Report
     */
    private function markReportAsPublished(Report $report, User $publisher): Report
    {
        return $this->reportRepository->update(
            $report,
            [
                "published_at" => Carbon::now("Asia/Muscat"),
                "publisher_id" => $publisher->id
            ]);
    }


    /**
     * Mark report as unpublished
     *
     * @param Report $report
     * @return Report
     */
    private function markReportAsUnpublished(Report $report): Report
    {
        return $this->reportRepository->update(
            $report,
            [
                "published_at" => null,
                "publisher_id" => null
            ]);
    }

    /**
     * Mark report as published
     *
     * @param Report $report
     * @param User $rejecter
     * @param string $comment
     * @return Report
     */
    private function markReportAsRejected(Report $report, User $rejecter, string $comment): Report
    {
        return $this->reportRepository->update(
            $report,
            [
                "approved_at" => Carbon::now("Asia/Muscat"),
                "approver_id" => $rejecter->id,
                "status" => false,
                "comment" => $comment
            ]);
    }


    /**
     * Process the published report - update timeline and check acceptance status
     *
     * @param Report $report
     * @return void
     */
    private function processPublishedReport(Report $report, bool $silentlyPublish = false): void
    {

        $report->loadMissing("acceptanceItem.acceptance");

        $acceptanceItem = $report->acceptanceItem;
        $user = auth()->user();
        // Update timeline
        $this->acceptanceItemService->updateAcceptanceItemTimeline($acceptanceItem, "Report Published By {$user->name}");

        ReportPublishedEvent::dispatch($report->acceptanceItem->acceptance, $silentlyPublish);

    }

    /**
     * Process the published report - update timeline and check acceptance status
     *
     * @param Report $report
     * @return void
     */
    private function processUnpublishedReport(Report $report): void
    {

        $report->loadMissing("acceptanceItem.acceptance");

        $acceptanceItem = $report->acceptanceItem;
        $user = auth()->user();
        // Update timeline
        $this->acceptanceItemService->updateAcceptanceItemTimeline($acceptanceItem, "Report Unpublished By {$user->name}");

    }

    /**
     * Get all data needed for report generation
     */
    public function getReportData(Report $report): array
    {
        return $this->reportDataService->getReportData($report);
    }

    protected function createOrUpdateReportParameters(Report $report, array $parameters): void
    {
        $report->load("reportTemplate.parameters", "parameters");
        DB::beginTransaction();
        foreach ($parameters as $parameter => $value) {
            $reportTemplateParameter = $report->reportTemplate->parameters->find(last(explode("_", $parameter)));
            if ($reportTemplateParameter) {

                if ($reportTemplateParameter->type == "image") {
                    PatientDocumentUpdateEvent::dispatch($value->hash, $value->owner_id, DocumentTag::IMAGE->value, "report", $report->id);
                    $value = route("documents.download", $value->hash);
                }
                $para = $report->parameters->where("parameter_id", $reportTemplateParameter->id)->first();
                if ($para) {
                    $para->value = $value;
                    $this->reportParameterRepository->save($para);
                } else {
                    $para = $this->reportParameterRepository->create([
                        "parameter_id" => $reportTemplateParameter->id,
                        "report_id" => $report->id,
                        "value" => $value
                    ]);
                }
            }
        }
        DB::commit();
    }

}
