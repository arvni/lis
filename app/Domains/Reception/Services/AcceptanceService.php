<?php

namespace App\Domains\Reception\Services;


use App\Domains\Document\Enums\DocumentTag;
use App\Domains\Laboratory\Enums\TestType;
use App\Domains\Reception\Adapters\LaboratoryAdapter;
use App\Domains\Reception\Adapters\ReferrerAdapter;
use App\Domains\Reception\Adapters\SettingAdapter;
use App\Domains\Reception\DTOs\AcceptanceDTO;
use App\Domains\Reception\DTOs\AcceptanceItemDTO;
use App\Domains\Reception\Enums\AcceptanceItemStateStatus;
use App\Domains\Reception\Enums\AcceptanceStatus;
use App\Domains\Reception\Events\AcceptanceCancelledEvent;
use App\Domains\Reception\Events\AcceptanceDeletedEvent;
use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Models\Patient;
use App\Domains\Reception\Models\Report;
use App\Domains\Reception\Repositories\AcceptanceRepository;
use App\Domains\User\Models\User;
use Carbon\Carbon;
use Exception;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Throwable;

class AcceptanceService
{
    protected string $phonePattern = "/^((\+|00)?968)?[279]\d{7}$/i";

    private readonly AcceptanceStatusService $statusService;
    private readonly AcceptanceBarcodeService $barcodeService;

    public function __construct(
        private readonly AcceptanceRepository  $acceptanceRepository,
        private readonly AcceptanceItemService $acceptanceItemService,
        private readonly LaboratoryAdapter     $laboratoryAdapter,
        private readonly SettingAdapter        $settingAdapter,
        private readonly ReferrerAdapter       $referrerAdapter,
        ?AcceptanceStatusService               $statusService = null,
        ?AcceptanceBarcodeService              $barcodeService = null,
    )
    {
        // Status decisions and barcode grouping were split out of this service
        // (improvement-plan #26). They reuse this service's own dependencies so
        // existing callers — including tests that build the service with the five
        // original mocks — keep working unchanged; the container injects the real
        // collaborators in production.
        $this->statusService = $statusService ?? new AcceptanceStatusService($acceptanceRepository, $referrerAdapter);
        $this->barcodeService = $barcodeService ?? new AcceptanceBarcodeService();
    }

    public function listAcceptances(array $queryData): LengthAwarePaginator
    {
        return $this->acceptanceRepository->ListAcceptances($queryData);
    }

    public function exportAcceptances(array $queryData): \Illuminate\Support\Collection
    {
        return $this->acceptanceRepository->exportAcceptances($queryData);
    }

    public function getReferrerAcceptanceReported(int|string $referrer_id, mixed $date): \Illuminate\Support\Collection
    {
        return $this->acceptanceRepository->getReported($referrer_id, $date);
    }

    public function listSampleCollections(array $queryData): LengthAwarePaginator
    {
        $minAllowablePaymentPercentage = (float)$this->settingAdapter->getSettingByClassAndKey('Payment', 'minPayment');

        return $this->acceptanceRepository->listSampleCollection($queryData, $minAllowablePaymentPercentage);
    }

    public function listWaitingForPublish(array $queryData): LengthAwarePaginator
    {
        return $this->acceptanceRepository->listWaitingForPublish($queryData);
    }

    public function listWaitingForFinancialCheck(array $queryData): LengthAwarePaginator
    {
        return $this->acceptanceRepository->listWaitingForFinancialCheck($queryData);
    }

    /**
     * Approve financial check for an acceptance
     *
     * @param Acceptance $acceptance
     * @param int $userId
     * @return Acceptance
     */
    public function approveFinancial(Acceptance $acceptance, int $userId): Acceptance
    {
        return $this->acceptanceRepository->updateAcceptance($acceptance, [
            'financial_approved' => true,
            'financial_approved_by' => $userId,
            'financial_approved_at' => Carbon::now("Asia/Muscat")
        ]);
    }

    public function storeAcceptance(AcceptanceDTO $acceptanceDTO): Acceptance
    {
        $acceptance = $this->acceptanceRepository
            ->createAcceptance(Arr::except($acceptanceDTO->toArray(), ["acceptance_items"]));

        if ($acceptanceDTO->consultationId) {
            $test = $this->settingAdapter->getSettingByClassAndKey("Acceptance", "defaultConsultationMethod");
            if ($test && isset($test["id"])) {
                $test = $this->laboratoryAdapter->getTestById($test["id"]);
                if ($test) {
                    $methodTest = $test->methodTests->first();
                    $acceptanceDTO->acceptanceItems["tests"][] = [
                        'method_test' => $methodTest,
                        "price" => $methodTest->method->price,
                        'discount' => 0,
                        [],
                        "samples" => [["patients" => [["id" => $acceptanceDTO->patientId]]]],
                        "customParameters" => []
                    ];
                }
            }
        }


        $acceptanceItems = $this->prepareAcceptanceItems($acceptance, $acceptanceDTO->acceptanceItems);
        foreach ($acceptanceItems as $acceptanceItem) {
            if (!$acceptanceItem->deleted)
                $this->acceptanceItemService->storeAcceptanceItem($acceptanceItem);
        }
        return $acceptance;
    }

    /**
     * Load all display relations for a single acceptance record.
     * Only call this for one record at a time; the deep nested eager loads
     * (referrerTests, activeSamples, etc.) are intentionally scoped per-record.
     */
    public function showAcceptance(Acceptance $acceptance): Acceptance
    {
        $referrerId = $acceptance->referrer_id;
        $acceptance->load([
            "patient" => function ($query) {
                $query->with([
                    "ownedDocuments" => function ($q) {
                        $q->where("Tag", DocumentTag::DOCUMENT);
                    }]);
            },
            "acceptanceItems" => function ($q) use ($referrerId) {
                $q->with([
                    "methodTest" => function ($methodTestQuery) use ($referrerId) {
                        $methodTestQuery
                            ->with([
                                "test" => function ($testQuery) use ($referrerId) {
                                    $with = ["methodTests.method"];
                                    if ($referrerId) {
                                        $with["referrerTests"] = function ($query) use ($referrerId) {
                                            $query->where("referrer_id", $referrerId);
                                        };
                                    }
                                    $testQuery->with($with);
                                },
                                "method.test.sampleTypes",
                            ]);
                    },
                    "patients",
                    "latestState",
                    "activeSamples",
                ]);
            },
            "invoice.payments.cashier",
            "invoice.payments.payer",
            "invoice.owner",
            "prescription",
            "consultation.patient",
            "consultation.consultant",
            "doctor",
            "referrer",
            "acceptor",
            "sampler:name,id",
            "tags"
        ]);
        return $acceptance;
    }

    /**
     * @throws Exception|Throwable
     */
    public function updateAcceptance(Acceptance $acceptance, array $data): Acceptance
    {
        // Convert the validated data to DTO
        $acceptanceDTO = AcceptanceDTO::createFromRequestData(array_merge($acceptance->toArray(), $data));

        // Process based on current step
        $step = $data['step'] ?? 5;

        try {
            DB::beginTransaction();

            switch ($step) {
                case 0: // Patient Information
                    // Update only step information
                    $this->acceptanceRepository->updateAcceptance($acceptance, [
                        'step' => min($acceptanceDTO->step + 1, 5)
                    ]);
                    break;

                case 1: // Consultation
                    // Update consultation and step
                    $updateData = ['step' => min($acceptanceDTO->step + 1, 5)];

                    if ($acceptanceDTO->consultationId) {
                        $updateData['consultation_id'] = $acceptanceDTO->consultationId;
                    }

                    $this->acceptanceRepository->updateAcceptance($acceptance, $updateData);
                    break;

                case 2: // Doctor & Referral
                    // Process data for doctor and referral only
                    $this->processDoctorReferralData($acceptance, $acceptanceDTO);
                    break;

                case 3: // Tests Selection
                    // Process data for tests only
                    $this->processTestsData($acceptance, $acceptanceDTO);
                    $this->acceptanceRepository->updateAcceptance($acceptance, [
                        'step' => min($acceptanceDTO->step + 1, 5)
                    ]);
                    break;

                case 4: // Sampling & Delivery
                    // Process data for sampling and delivery only
                    $this->processSamplingDeliveryData($acceptance, $acceptanceDTO);
                    break;

                case 5: // Final Review - process everything
                default:
                    $acceptance = $this->acceptanceRepository->updateAcceptance($acceptance, [
                        "step" => 5,
                        "status" => $acceptance->status === AcceptanceStatus::PENDING ? AcceptanceStatus::WAITING_FOR_PAYMENT : $acceptance->status,
                        "waiting_for_pooling" => $acceptanceDTO->waitingForPooling,
                    ]);
                    break;
            }

            DB::commit();
            return $acceptance;

        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Process and update doctor and referral information
     *
     * @param Acceptance $acceptance
     * @param AcceptanceDTO $acceptanceDTO
     * @return void
     */
    private function processDoctorReferralData(Acceptance $acceptance, AcceptanceDTO $acceptanceDTO): void
    {
        // Process doctor data
        if (isset($acceptanceDTO->doctor) && !empty($acceptanceDTO->doctor["name"])) {
            if (!isset($acceptanceDTO->doctor["id"])) {
                // Create or get doctor and update the DTO
                $doctor = $this->laboratoryAdapter->createOrGetDoctor($acceptanceDTO->doctor);
                $acceptanceDTO->doctorId = $doctor->id;
            } else {
                $acceptanceDTO->doctorId = $acceptanceDTO->doctor["id"];
            }
        }

        // Prepare only the relevant data for update
        $updateData = [
            'step' => $acceptanceDTO->step + 1,
            'doctor_id' => $acceptanceDTO->doctorId,
        ];

        // Add referral info if present
        if (isset($acceptanceDTO->referrerId)) {
            $updateData['referrer_id'] = $acceptanceDTO->referrerId;
            $updateData['reference_code'] = $acceptanceDTO->referenceCode;
        }

        // Update using repository - only doctor and referral fields
        $this->acceptanceRepository->updateAcceptance($acceptance, $updateData);
    }

    /**
     * Process and update tests and panels data
     *
     * @param Acceptance $acceptance
     * @param AcceptanceDTO $acceptanceDTO
     * @return void
     */
    private function processTestsData(Acceptance $acceptance, AcceptanceDTO $acceptanceDTO): void
    {
        // Update step first
        $this->acceptanceRepository->updateAcceptance($acceptance, ['step' => $acceptanceDTO->step]);

        // If no acceptance items, exit early
        if (!isset($acceptanceDTO->acceptanceItems)) {
            return;
        }

        // Process acceptance items using existing logic
        $acceptanceItems = $this->prepareAcceptanceItems($acceptance, $acceptanceDTO->acceptanceItems);
        $updatedAcceptanceItems = [];
        foreach ($acceptanceItems as $acceptanceItemData) {
            if (!$acceptanceItemData->deleted) {
                $acceptanceItem = $this->acceptanceItemService->findAcceptanceItemById($acceptanceItemData->id);
                if ($acceptanceItem)
                    $updatedAcceptanceItems[] = $this->acceptanceItemService->updateAcceptanceItem($acceptanceItem, $acceptanceItemData);
                else
                    $updatedAcceptanceItems[] = $this->acceptanceItemService->storeAcceptanceItem($acceptanceItemData);
            }
        }
        // Remove items not in the update
        $acceptance->acceptanceItems()->whereNotIn("id", collect($updatedAcceptanceItems)->pluck("id")->toArray())->delete();

        $this->referrerAdapter->syncOrdersForAcceptance($acceptance);
    }

    /**
     * Update the price, discount and custom parameters of existing acceptance
     * items from the test/panel editor payload, reusing the same transform the
     * acceptance edit flow uses. Unlike processTestsData this never creates or
     * deletes items — it only updates rows that already belong to the given
     * acceptance, so it is safe to call with a single edited test or panel.
     *
     * @param Acceptance $acceptance
     * @param array $acceptanceItems editor payload: ["tests" => [...], "panels" => [...]]
     * @return void
     * @throws Throwable
     */
    public function updateAcceptanceItemsFromEditor(Acceptance $acceptance, array $acceptanceItems): void
    {
        DB::beginTransaction();
        try {
            $prepared = $this->prepareAcceptanceItems($acceptance, $acceptanceItems);
            foreach ($prepared as $dto) {
                if ($dto->deleted || !$dto->id) {
                    continue;
                }
                $existing = $this->acceptanceItemService->findAcceptanceItemById($dto->id);
                if ($existing && (int)$existing->acceptance_id === (int)$acceptance->id) {
                    $this->acceptanceItemService->updateAcceptanceItem($existing, $dto);
                }
            }
            $this->referrerAdapter->syncOrdersForAcceptance($acceptance);
            DB::commit();
        } catch (Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Process and update sampling and delivery data
     *
     * @param Acceptance $acceptance
     * @param AcceptanceDTO $acceptanceDTO
     * @return void
     */
    private function processSamplingDeliveryData(Acceptance $acceptance, AcceptanceDTO $acceptanceDTO): void
    {
        // Prepare update data
        $updateData = [
            'step' => min($acceptanceDTO->step + 1, 5),
            'samplerGender' => $acceptanceDTO->samplerGender,
            'out_patient' => $acceptanceDTO->outPatient,
            'sampler_id' => $acceptanceDTO->samplerId,
            'waiting_for_pooling' => $acceptanceDTO->waitingForPooling,
            'how_found_us' => $acceptanceDTO->howFoundUs,
        ];

        // Process reporting method if it exists
        if (isset($acceptanceDTO->howReport) && is_array($acceptanceDTO->howReport)) {
            // Extract reporting method details
            $updateData['howReport'] = $acceptanceDTO->howReport ?? null;
        }

        // Update acceptance using repository
        $this->acceptanceRepository->updateAcceptance($acceptance, $updateData);
    }

    /**
     * @throws Exception
     */
    public function deleteAcceptance(Acceptance $acceptance): void
    {

        if ($acceptance->status !== AcceptanceStatus::REPORTED && $acceptance->status !== AcceptanceStatus::PROCESSING && $acceptance->status !== AcceptanceStatus::CANCELLED) {
            $invoiceId = $acceptance->invoice_id;
            $this->acceptanceRepository->deleteAcceptance($acceptance);
            if ($invoiceId)
                AcceptanceDeletedEvent::dispatch($invoiceId);
        } else
            throw new Exception("this Acceptance cannot be deleted");
    }

    public function getAcceptanceById(int|string $id): ?Acceptance
    {
        return $this->acceptanceRepository->getAcceptanceById($id);
    }

    public function updateAcceptanceInvoice(Acceptance $acceptance, int|string $invoiceId): void
    {
        $this->acceptanceRepository->updateAcceptance($acceptance, [
            "invoice_id" => $invoiceId,
            "status" => $acceptance->status == AcceptanceStatus::PENDING ? AcceptanceStatus::WAITING_FOR_PAYMENT : $acceptance->status
        ]);
    }

    public function updateAcceptanceStatus(Acceptance $acceptance, AcceptanceStatus $status): void
    {
        $this->statusService->updateAcceptanceStatus($acceptance, $status);
    }

    /** @return array<string, mixed> */
    public function listBarcodes(Acceptance $acceptance): array
    {
        return $this->barcodeService->listBarcodes($acceptance);
    }

    /**
     * Publish all unpublished reports for an acceptance
     *
     * @param Acceptance $acceptance
     * @param int $publisherId
     * @param bool $silentlyPublish
     * @return Acceptance
     */
    public function publishAcceptance(Acceptance $acceptance, int $publisherId, bool $silentlyPublish = false): Acceptance
    {
        DB::beginTransaction();
        try {
            // Load acceptance items with reports
            $acceptance->load([
                'acceptanceItems' => function ($q) {
                    $q->where('reportless', false)
                        ->with('report');
                }
            ]);

            $publishedAt = Carbon::now("Asia/Muscat");

            // Publish all unpublished reports
            foreach ($acceptance->acceptanceItems as $acceptanceItem) {
                if (!$acceptanceItem->reportless && $acceptanceItem->report && !$acceptanceItem->report->published_at) {
                    $report=$acceptanceItem->report;
                    Report::where("id",$report->id)
                        ->update([
                        'published_at' => $publishedAt,
                        'publisher_id' => $publisherId
                    ]);

                    // Update timeline
                    $publisher = User::find($publisherId);
                    $this->acceptanceItemService->updateAcceptanceItemTimeline(
                        $acceptanceItem,
                        "Report Published By {$publisher->name}"
                    );
                }
            }

            DB::commit();

            // Check if all tests are published and send notifications
            $this->checkAcceptanceReport($acceptance, $silentlyPublish);

            return $acceptance->fresh();
        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function checkAndUpdateAcceptanceStatus(Acceptance $acceptance): void
    {
        $this->statusService->checkAndUpdateAcceptanceStatus($acceptance);
    }

    public function checkAcceptanceReport(Acceptance $acceptance, bool $silent = false): void
    {
        $this->statusService->checkAcceptanceReport($acceptance, $silent);
    }

    /**
     * Prepare acceptance items for update
     *
     * @param Acceptance $acceptance
     * @param array $acceptanceItems
     * @return array
     */

    private function prepareAcceptanceItems(Acceptance $acceptance, array $acceptanceItems): array
    {
        $output = [];
        if (isset($acceptanceItems['tests']) && $acceptanceItems['tests'] && is_array($acceptanceItems['tests']) && count($acceptanceItems["tests"])) {
            foreach ($acceptanceItems["tests"] as $acceptance_item) {
                $isService = ($acceptance_item['method_test']['test']['type'] ?? null) === TestType::SERVICE->value;
                $output[] = new AcceptanceItemDTO(
                    $acceptance->id,
                    $acceptance_item['method_test']['id'],
                    $acceptance_item["price"],
                    $acceptance_item['discount'],
                    array_merge(($acceptance_item["customParameters"] ?? []), Arr::except($acceptance_item, ["method_test", "price", "discount", "patients", "timeLine", "id", "customParameters", "sampleless"])),
                    !($acceptance_item['timeLine'] ?? null) ? [
                        Carbon::now()->format("Y-m-d H:i:s") => "Created By " . auth()->user()->name,
                    ] : [
                        ...$acceptance_item['timeLine'],
                        Carbon::now()->format("Y-m-d H:i:s") => "Edited By " . auth()->user()->name,
                    ],
                    $isService ? 0 : ($acceptance_item["no_sample"] ?? (count($acceptance_item["samples"] ?? [1]) || 1)),
                    $acceptance_item["id"] ?? null,
                    null,
                    $acceptance_item["deleted"] ?? false,
                    $isService || ($acceptance_item["sampleless"] ?? false),
                    $isService || ($acceptance_item["reportless"] ?? false),
                );
            }
        }
        if (isset($acceptanceItems['panels']) && is_array($acceptanceItems['panels'])) {
            foreach ($acceptanceItems['panels'] as $panelData) {
                if (isset($panelData["acceptanceItems"]) && is_array($panelData["acceptanceItems"])) {
                    $panelID = Str::uuid();
                    $panelSampleless = $panelData["sampleless"] ?? false;
                    $panelReportless = $panelData["reportless"] ?? false;
                    foreach ($panelData["acceptanceItems"] as $item) {
                        $itemSampleless = $panelSampleless || ($item["sampleless"] ?? false);
                        $isService = ($item['method_test']['test']['type'] ?? null) === TestType::SERVICE->value;
                        $output[] = new AcceptanceItemDTO(
                            $acceptance->id,
                            $item['method_test']['id'],
                            $panelData['price'] / count($panelData['acceptanceItems']), // Distribute price among items
                            $panelData['discount'] / count($panelData['acceptanceItems']), // Distribute discount among items
                            array_merge(($item["customParameters"] ?? []), Arr::except($item, ["method_test", "price", "discount", "patients", "timeLine", "id", "customParameters", "sampleless"])),
                            !($item['timeLine'] ?? null) ? [
                                Carbon::now()->format("Y-m-d H:i:s") => "Created By " . auth()->user()->name,
                            ] : [
                                ...$item['timeLine'],
                                Carbon::now()->format("Y-m-d H:i:s") => "Edited By " . auth()->user()->name,
                            ],
                            $isService ? 0 : ($item["no_sample"] ?? (count($item["samples"] ?? [1]) || 1)),
                            $item["id"] ?? null,
                            $panelID,
                            $panelData["deleted"] ?? false,
                            $isService || $itemSampleless,
                            $isService || $panelReportless || ($item["reportless"] ?? false),
                        );
                    }
                }
            }
        }
        return $output;
    }

    public function getPendingAcceptance(Patient $patient): ?Acceptance
    {
        return $this->acceptanceRepository->getPendingAcceptance($patient);
    }

    public function cancelAcceptance(Acceptance $acceptance): void
    {
        $this->acceptanceRepository->updateAcceptance($acceptance, [
            "status" => AcceptanceStatus::CANCELLED
        ]);
        $acceptance->acceptanceItemStates()->update(["status" => AcceptanceItemStateStatus::REJECTED]);
        if ($acceptance->invoice_id) {
            AcceptanceCancelledEvent::dispatch($acceptance->invoice_id);
        }
    }

    /**
     * Prepare acceptance data for editing, including organized items
     *
     * @param Acceptance $acceptance
     * @param null $step
     * @return array
     */
    public function prepareAcceptanceForEdit(Acceptance $acceptance, $step = null): array
    {
        // Get base acceptance data
        $acceptanceData = $this->showAcceptance($acceptance)->toArray();
        if ($acceptance->status !== AcceptanceStatus::PENDING) {
            $acceptanceData["step"] = $step ?? 5;
        }

        // Process and organize acceptance items
        $acceptanceData['acceptanceItems'] = $this->organizeAcceptanceItems(
            $acceptanceData['acceptance_items']
        );
        return $acceptanceData;
    }

    /**
     * Organize acceptance items by type for editing interface
     *
     * @param array $acceptanceItems
     * @return array
     */
    public function organizeAcceptanceItems(array $acceptanceItems): array
    {
        $groupedItems = $this->acceptanceRepository->groupItemsByTestType($acceptanceItems);
        // Get tests and services
        $tests = $groupedItems->get(TestType::TEST->value, collect());
        $services = $groupedItems->get(TestType::SERVICE->value, collect());


        // Build final structure
        return [
            "tests" => [...$tests, ...$services],
            "panels" => $groupedItems->get(TestType::PANEL->value, []),
        ];
    }

    public function checkAcceptanceStatus(Acceptance $acceptance): void
    {
        $this->statusService->checkAcceptanceStatus($acceptance);
    }
}
