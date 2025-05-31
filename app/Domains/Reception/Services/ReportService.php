<?php

namespace App\Domains\Reception\Services;

use App\Domains\Document\Enums\DocumentTag;
use App\Domains\Document\Services\DocumentService;
use App\Domains\Laboratory\Models\Method;
use App\Domains\Laboratory\Models\Test;
use App\Domains\Reception\Adapters\LaboratoryAdapter;
use App\Domains\Reception\Events\PatientDocumentUpdateEvent;
use App\Domains\Reception\Events\ReportPublishedEvent;
use App\Domains\Reception\Factories\SignerFactory;
use App\Domains\Reception\Models\AcceptanceItem;
use App\Domains\Reception\Models\Report;
use App\Domains\Reception\Models\Sample;
use App\Domains\Reception\Repositories\AcceptanceItemRepository;
use App\Domains\Reception\Repositories\ReportParameterRepository;
use App\Domains\Reception\Repositories\ReportRepository;
use App\Domains\Reception\Repositories\SignerRepository;
use App\Domains\User\Models\User;
use Carbon\Carbon;
use DNS1D;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use InvalidArgumentException;
use PhpOffice\PhpWord\Exception\Exception;
use RuntimeException;

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
        private readonly DocumentService      $documentService,
        private readonly BuildWordFileService $buildWordFileService,
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

    public function listReports($queryData)
    {
        return $this->reportRepository->list($queryData);
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
            $this->documentService->storeDocument(
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
                                 ?array $additionalFiles = []): Report
    {
        // Get acceptance item
        $acceptanceItem = $this->acceptanceItemRepository->findAcceptanceItemById($acceptanceItemId);

        // Create report
        $report = $this->reportRepository->update($report,
            [
                'reported_at' => Carbon::now("Asia/Muscat"),
                'reporter_id' => $user->id,
                'acceptance_item_id' => $acceptanceItemId,
                'report_template_id' => $reportTemplateId,
                'approver' => null,
                'approved_at' => null,
            ]);
        // Create signer
        $report->signers()->delete();
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
        $this->acceptanceItemService->updateAcceptanceItemTimeline($acceptanceItem, "Report Updated By $user->name");

        if (isset($reportedDocument['id']))
            $this->processDocument($reportedDocument['id'], $report, DocumentTag::REPORTED);
        elseif (count($parameters) > 0) {
            $data = $this->getReportData($report);
            $docAddr = $this->buildWordFileService->build($report->reportTemplate->template->path, $data);
            $this->documentService->storeDocument(
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
        $test = $this->laboratoryService->getTestForAcceptanceItem($acceptanceItem);
        return $this->laboratoryService->getTemplateUrl($test->reportTemplates);
    }

    /**
     * Get method from laboratory domain via adapter
     *
     * @param AcceptanceItem $acceptanceItem
     * @return Method
     */
    public function getMethod(AcceptanceItem $acceptanceItem): Method
    {
        return $this->laboratoryService->getMethodForAcceptanceItem($acceptanceItem);
    }

    /**
     * Get test from laboratory domain via adapter
     *
     * @param AcceptanceItem $acceptanceItem
     * @return Test
     */
    public function getTest(AcceptanceItem $acceptanceItem): Test
    {
        return $this->laboratoryService->getTestForAcceptanceItem($acceptanceItem);
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
     * @return Collection
     */
    public function formatDocumentFiles($documents)
    {
        return $documents->map(function ($item) {
            return [
                "id" => $item["hash"],
                "originalName" => $item["originalName"],
                "tag" => $item["tag"],
                "created_at" => $item["created_at"]
            ];
        });
    }

    /**
     * Get report history by acceptance item ID
     *
     * @param int $acceptanceItemId
     * @return Collection
     */
    public function getHistoryByAcceptanceItemId(int $acceptanceItemId): Collection
    {
        return Report::where("acceptance_item_id", $acceptanceItemId)
            ->where("status", false)
            ->orderBy("approved_at")
            ->with([
                "Documents",
                "Reporter:name,id",
                "Approver:name,id"
            ])
            ->get();
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
        ?array $clinicalCommentDocument = null
    ): Report
    {
        // Update report with approval information
        $report = $this->markReportAsApproved($report, $approver);

        // Process clinical comment document if provided
        if ($clinicalCommentDocument && isset($clinicalCommentDocument['id'])) {
            $this->processDocument($clinicalCommentDocument['id'], $report, DocumentTag::CLINICAL_COMMENT);
        }

        // Create approver signer record
        $this->createApproverSignerRecord($report, $approver);

        // Update acceptance item timeline
        $report->loadMissing("acceptanceItem");
        $this->acceptanceItemService->updateAcceptanceItemTimeline($report->acceptanceItem, "Report Approver By $approver->name");

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
     * @param string $publishedDocumentId
     * @return Report
     */
    public function publishReport(Report $report, User $publisher, string $publishedDocumentId): Report
    {
        // Mark report as published
        $report = $this->markReportAsPublished($report, $publisher);

        // Attach published document if provided
        $this->processDocument($publishedDocumentId, $report, DocumentTag::PUBLISHED);

        // Update acceptance item timeline and check if all tests are published
        $this->processPublishedReport($report);

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
    private function processDocument($documentId, Report $report, DocumentTag $documentTag): void
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
            $this->documentService->deleteDocument($report->publishedDocument);
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
        // Create signer
        $signer = $this->signerFactory->createFromUser($approver, $report);
        $this->signerRepository->save($signer);

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
    private function processPublishedReport(Report $report): void
    {

        $report->loadMissing("acceptanceItem.acceptance");

        $acceptanceItem = $report->acceptanceItem;
        $user = auth()->user();
        // Update timeline
        $this->acceptanceItemService->updateAcceptanceItemTimeline($acceptanceItem, "Report Published By {$user->name}");

        ReportPublishedEvent::dispatch($report->acceptanceItem->acceptance);

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
     * Load necessary relationships for report data generation
     */
    public function loadReportRelationships(Report $report): Report
    {
        return $report->load([
            "acceptanceItem.patients",
            "acceptanceItem.activeSample.sampleType",
            "acceptanceItem.test",
            "signers",
            "acceptanceItem.acceptance.referrer",
            "parameters.parameter"
        ]);
    }

    /**
     * Get all data needed for report generation
     */
    public function getReportData(Report $report): array
    {
        if (!$report->exists) {
            throw new InvalidArgumentException('Report must be a persisted model');
        }

        $report = $this->loadReportRelationships($report);

        // Check if required relationships are loaded
        if (!$report->acceptanceItem || !$report->acceptanceItem->activeSample) {
            throw new RuntimeException('Required report relationships not loaded');
        }

        $patientData = $this->preparePatientData($report->acceptanceItem->patients);
        $sampleData = $this->getSampleData($report->acceptanceItem->activeSample);
        $signers = $this->prepareSigners($report->signers);
        if (count($report->parameters)) ;
        $parametersData = $this->prepareParametersData($report->parameters);
        $referrer = [];
        if ($report->acceptanceItem->acceptance->referrer) {
            $referrer = $this->prepareReferrer($report->acceptanceItem->acceptance->referrer);
        }

        $other = [
            "test" => $report->acceptanceItem->test->name,
            "report_approved_at" => $report->approved_at,
        ];

        return Arr::undot(array_merge(
            Arr::dot($patientData),
            Arr::dot($signers),
            Arr::dot($sampleData),
            Arr::dot($other),
            Arr::dot($referrer),
            Arr::dot($parametersData)
        ));
    }

    /**
     * Prepare patient data for report
     */
    public function preparePatientData($patients): array
    {
        if (!$patients || $patients->isEmpty()) {
            return ["patient_0_full_name" => "No patient data available"];
        }

        $output = [];
        foreach ($patients as $key => $patient) {
            $output["patient_{$key}_full_name"] = $patient->fullName ?? 'N/A';
            $output["patient_{$key}_no_id"] = $patient->idNo ?? 'N/A';
            $output["patient_{$key}_gender"] = $patient->gender ?? 'N/A';
            $output["patient_{$key}_date_of_birth"] = $patient->date_of_birth ?? 'N/A';
            $output["patient_{$key}_nationality"] = $patient->nationality ?? 'N/A';
            $output["patient_{$key}_age"] = $patient->age ?? 'N/A';
        }
        return $output;
    }

    /**
     * Get sample data for report
     */
    public function getSampleData(Sample $sample): array
    {
        $sample->loadAggregate("sampleType", "name");

        $barcodeValue = strtoupper($sample->barcode);
        $barcodePath = storage_path('app/barcodes/');
        if (!file_exists($barcodePath)) {
            mkdir($barcodePath, 0755, true);
        }
        return [
            "barcode" => $barcodeValue,
            "sample_created_at" => $sample->created_at,
            "sample_collection_date" => $sample->collection_date,
            "sample_type_name" => $sample->sample_type_name ?? 'N/A',
            "images" => [
                "logo" => url("/images/logo.png"),
                "barcodeImg" => $barcodeValue ? DNS1D::getBarcodePNGPath($barcodeValue, 'C128', 1, 30) : null
            ]
        ];
    }

    /**
     * Prepare signers data for report
     */
    public function prepareSigners($signers): array
    {
        $output = ["images" => []];

        if (!$signers || $signers->isEmpty()) {
            return $output;
        }

        foreach ($signers as $signer) {
            if (!$signer) {
                continue;
            }

            $output["signer_{$signer->row}_name"] = $signer->name ?? 'N/A';
            $output["signer_{$signer->row}_title"] = $signer->title ?? 'N/A';

            if (!empty($signer->signature)) {
                $output["images"]["signer_{$signer->row}_signature"] = url($signer->signature);
            }

            if (!empty($signer->stamp)) {
                $output["images"]["signer_{$signer->row}_stamp"] = url($signer->stamp);
            }
        }

        return $output;
    }

    public function prepareReferrer($referrer): array
    {
        return [
            "referrer_name" => $referrer->billingInfo["name"] ?? $referrer->fullName,
            "address" => $referrer->billingInfo["address"] ?? "N/A",
            "vatIn" => $referrer->billingInfo["vatIn"] ?? "N/A",
            "phone" => $referrer->billingInfo["phone"] ?? $referrer->phoneNo,
            "email" => $referrer->billingInfo["email"] ?? $referrer->email,
            "city" => $referrer->billingInfo["city"] ?? "N/A",
            "country" => $referrer->billingInfo["country"] ?? "N/A",
        ];
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

    private function prepareParametersData($parameters): array
    {
        $output = [];
        foreach ($parameters as $parameter) {
            if ($parameter->parameter->type == "image") {
                $output["images"][$parameter->parameter->element] = $parameter->value;
            } else {
                $output[$parameter->parameter->element] = $parameter->value;
            }
        }
        return $output;
    }

}
