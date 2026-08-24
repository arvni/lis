<?php

declare(strict_types=1);

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
use App\Domains\Reception\Events\AcceptanceCardReleasedEvent;
use App\Domains\Reception\Events\AcceptanceCancelledEvent;
use App\Domains\Reception\Events\AcceptanceItemsChangedEvent;
use App\Domains\Reception\Events\AcceptanceDeletedEvent;
use App\Domains\Reception\Events\AcceptanceRestoredEvent;
use App\Domains\Reception\Exceptions\AcceptanceItemTestNotChangeableException;
use App\Domains\Reception\Exceptions\AcceptanceNotDeletableException;
use App\Domains\Reception\Exceptions\AcceptanceNotDeletedException;
use App\Domains\Reception\Exceptions\AcceptanceNotFinanciallyApprovableException;
use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Models\AcceptanceItem;
use App\Domains\Reception\Models\Patient;
use App\Domains\Reception\Models\Report;
use App\Domains\Reception\Repositories\AcceptanceRepository;
use App\Domains\Shared\Helpers\AmountDistributor;
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
    /**
     * The only statuses an acceptance can be deleted from. Everything else — a
     * reported acceptance above all, but equally one mid-sampling or waiting on
     * money — has to be cancelled first.
     *
     * Kept in sync with `isDeletableStatus()` in
     * resources/js/Pages/Acceptance/Index/helpers.jsx, which hides the delete
     * action everywhere else.
     */
    private const DELETABLE_STATUSES = [
        AcceptanceStatus::PENDING,
        AcceptanceStatus::PROCESSING,
        AcceptanceStatus::CANCELLED,
    ];

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
     * @param bool $allowWithoutInvoice Reviewer acknowledged the missing invoice in the confirmation dialog.
     * @return Acceptance
     *
     * @throws AcceptanceNotFinanciallyApprovableException
     */
    public function approveFinancial(Acceptance $acceptance, int $userId, bool $allowWithoutInvoice = false): Acceptance
    {
        // Finance normally signs off on an invoice, so releasing an uninvoiced
        // acceptance to publishing — and on to REPORTED — takes a deliberate
        // acknowledgement. The confirmation dialog is where that is given; the
        // default refuses, so a request that never saw the dialog cannot slip
        // an unbilled acceptance through.
        if (!$acceptance->invoice_id && !$allowWithoutInvoice) {
            throw AcceptanceNotFinanciallyApprovableException::missingInvoice($acceptance->id);
        }

        // Approving twice would run checkAcceptanceReport again on an already
        // reported acceptance, re-pushing it to the referrer provider and
        // re-sending the published-report notifications.
        if ($acceptance->financial_approved) {
            throw AcceptanceNotFinanciallyApprovableException::alreadyApproved($acceptance->id);
        }

        $acceptance = $this->acceptanceRepository->updateAcceptance($acceptance, [
            'financial_approved' => true,
            'financial_approved_by' => $userId,
            'financial_approved_at' => now()
        ]);

        // The acceptance was parked at WAITING_FOR_FINANCIAL_APPROVAL waiting for
        // exactly this, so recompute. checkAcceptanceReport handles the terminal
        // case (everything already published → REPORTED, with the referrer sync
        // and published-report notifications); anything short of that falls
        // through to the regular state machine, which releases it to
        // WAITING_FOR_PUBLISHING.
        $this->statusService->checkAcceptanceReport($acceptance);

        if ($acceptance->status !== AcceptanceStatus::REPORTED) {
            $this->statusService->checkAndUpdateAcceptanceStatus($acceptance);
        }

        return $acceptance;
    }

    public function storeAcceptance(AcceptanceDTO $acceptanceDTO): Acceptance
    {
        return DB::transaction(function () use ($acceptanceDTO): Acceptance {
            $acceptance = $this->acceptanceRepository
                ->createAcceptance(Arr::except($acceptanceDTO->toArray(), ["acceptance_items"]));

            if ($acceptanceDTO->consultationId) {
                $test = $this->settingAdapter->getSettingByClassAndKey("Acceptance", "defaultConsultationMethod");
                if ($test && isset($test["id"])) {
                    $test = $this->laboratoryAdapter->getTestById((int)$test["id"]);
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
        });
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

        // Clearing the pooling flag ends pooling, and the acceptance is parked at
        // POOLING while it is set. Remember the previous value so we can recompute
        // the real status once the update lands (see below).
        $wasWaitingForPooling = (bool) $acceptance->waiting_for_pooling;

        return DB::transaction(function () use ($acceptance, $acceptanceDTO, $step, $wasWaitingForPooling): Acceptance {
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
                    $finalizedStatus = $this->resolveFinalizedStatus($acceptance);
                    $acceptance = $this->acceptanceRepository->updateAcceptance($acceptance, [
                        "step" => 5,
                        "waiting_for_pooling" => $acceptanceDTO->waitingForPooling,
                    ]);
                    // Through the status service, not the repository: a status
                    // change has to mirror onto the linked referrer orders and
                    // push the provider.
                    $this->statusService->setStatusIfChanged($acceptance, $finalizedStatus);
                    break;
            }

            // Pooling just ended: nothing else recomputes the status, so the
            // acceptance would stay at POOLING forever. Re-run the status check
            // now that applyPoolingPriority no longer short-circuits it.
            if ($wasWaitingForPooling) {
                $acceptance->refresh();
                if (! $acceptance->waiting_for_pooling) {
                    $this->statusService->checkAndUpdateAcceptanceStatus($acceptance);
                    $acceptance->refresh();
                }
            }

            return $acceptance;
        });
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
     * The edited item can also point at a different test than it did: the row
     * is moved onto the new method test in place, keeping its id, timeline and
     * everything hanging off it — see noteTestChange() for the one case where
     * that is refused.
     *
     * @param Acceptance $acceptance
     * @param array $acceptanceItems editor payload: ["tests" => [...], "panels" => [...]]
     * @return void
     * @throws AcceptanceItemTestNotChangeableException
     * @throws Throwable
     */
    public function updateAcceptanceItemsFromEditor(Acceptance $acceptance, array $acceptanceItems): void
    {
        DB::transaction(function () use ($acceptance, $acceptanceItems): void {
            $prepared = $this->prepareAcceptanceItems($acceptance, $acceptanceItems);
            foreach ($prepared as $dto) {
                if ($dto->deleted || !$dto->id) {
                    continue;
                }
                $existing = $this->acceptanceItemService->findAcceptanceItemById($dto->id);
                if ($existing && (int)$existing->acceptance_id === (int)$acceptance->id) {
                    $this->carryOverTimeline($existing, $dto);
                    $this->noteTestChange($existing, $dto);
                    $this->acceptanceItemService->updateAcceptanceItem($existing, $dto);
                }
            }
            $this->referrerAdapter->syncOrdersForAcceptance($acceptance);
        });
    }

    /**
     * Keep the item's own history: prepareAcceptanceItems() builds the timeline
     * from the payload alone, and the editor sends none, so without this the
     * row's entries would be replaced by a single fresh one — and labelled
     * "Created By", which an edit of an existing row is not.
     */
    private function carryOverTimeline(AcceptanceItem $acceptanceItem, AcceptanceItemDTO $dto): void
    {
        $existingTimeline = $acceptanceItem->timeline;
        if (!is_array($existingTimeline)) {
            $existingTimeline = json_decode($existingTimeline ?? "[]", true) ?? [];
        }

        $entries = array_map(
            static fn (string $message): string => str_replace("Created By", "Edited By", $message),
            $dto->timeline ?? []
        );

        $dto->timeline = array_merge($existingTimeline, $entries);
    }

    /**
     * Record on the DTO's timeline that the item is being moved onto another
     * test — and refuse the move outright once the item has a sample, a
     * workflow state or a report, because none of those would still describe
     * the test the item would end up on.
     *
     * @throws AcceptanceItemTestNotChangeableException
     */
    private function noteTestChange(AcceptanceItem $acceptanceItem, AcceptanceItemDTO $dto): void
    {
        if ((int)$acceptanceItem->method_test_id === $dto->methodTestId) {
            return;
        }

        if ($acceptanceItem->acceptanceItemStates()->exists()
            || $acceptanceItem->activeSamples()->exists()
            || $acceptanceItem->report()->exists()) {
            throw new AcceptanceItemTestNotChangeableException($acceptanceItem->id);
        }

        $from = $this->laboratoryAdapter->findTestByMethodTestId($acceptanceItem->method_test_id)->name
            ?? "method test #{$acceptanceItem->method_test_id}";
        $to = $this->laboratoryAdapter->findTestByMethodTestId($dto->methodTestId)->name
            ?? "method test #{$dto->methodTestId}";

        // prepareAcceptanceItems() always appends its own "Edited By …" entry
        // last; extend that one instead of adding a second entry, which would
        // collide with it on the same to-the-second timeline key.
        $lastKey = $dto->timeline ? array_key_last($dto->timeline) : null;
        if ($lastKey === null) {
            $dto->timeline[now()->format("Y-m-d H:i:s")] = "Test changed from $from to $to";

            return;
        }

        $dto->timeline[$lastKey] .= " — test changed from $from to $to";
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

        AcceptanceItemsChangedEvent::dispatch($acceptance->id);
    }

    /**
     * Soft-delete an acceptance, its items and its item states; its invoice is
     * cancelled — not deleted — through AcceptanceDeletedEvent. Nothing is
     * destroyed, so a delete is undone by restoreAcceptance().
     *
     * @throws AcceptanceNotDeletableException
     */
    public function deleteAcceptance(Acceptance $acceptance): void
    {
        if (!in_array($acceptance->status, self::DELETABLE_STATUSES, true)) {
            throw new AcceptanceNotDeletableException($acceptance->status);
        }

        $invoiceId = $acceptance->invoice_id;
        $this->acceptanceRepository->deleteAcceptance($acceptance);

        AcceptanceCardReleasedEvent::dispatch($acceptance->id, 'Acceptance deleted');

        if ($invoiceId) {
            AcceptanceDeletedEvent::dispatch($invoiceId);
        }
    }

    /**
     * Undo a delete: the acceptance, the items and item states that went down
     * with it, and — through AcceptanceRestoredEvent — its invoice's status.
     *
     * @throws AcceptanceNotDeletedException
     */
    public function restoreAcceptance(Acceptance $acceptance): void
    {
        if (!$acceptance->trashed()) {
            throw new AcceptanceNotDeletedException;
        }

        $this->acceptanceRepository->restoreAcceptance($acceptance);

        AcceptanceItemsChangedEvent::dispatch($acceptance->id);

        if ($acceptance->invoice_id) {
            AcceptanceRestoredEvent::dispatch($acceptance->invoice_id);
        }
    }

    public function listDeletedAcceptances(array $queryData): LengthAwarePaginator
    {
        return $this->acceptanceRepository->listDeletedAcceptances($queryData);
    }

    public function getAcceptanceById(int|string $id): ?Acceptance
    {
        return $this->acceptanceRepository->getAcceptanceById($id);
    }

    public function updateAcceptanceInvoice(Acceptance $acceptance, int|string $invoiceId): void
    {
        $finalizedStatus = $this->resolveFinalizedStatus($acceptance);

        $this->acceptanceRepository->updateAcceptance($acceptance, [
            "invoice_id" => $invoiceId,
        ]);

        // Through the status service, not the repository: a status change has to
        // mirror onto the linked referrer orders and push the provider.
        $this->statusService->setStatusIfChanged($acceptance, $finalizedStatus);
    }

    /**
     * Status an acceptance takes when it is finalized out of PENDING.
     *
     * - Non-PENDING statuses are preserved untouched: once an acceptance has
     *   moved past PENDING (e.g. sampling already passed), re-finalizing on an
     *   edit must never drag it backwards.
     * - Walk-in acceptances still wait for payment.
     * - Referred acceptances are billed to the referrer, so they bypass the
     *   patient payment gate. They only go to SAMPLING when something actually
     *   needs a sample; a fully sampleless acceptance (all items are therefore
     *   reportless too) has nothing to collect or report, so it goes straight to
     *   the finance gate — or is reported outright once finance has approved.
     */
    private function resolveFinalizedStatus(Acceptance $acceptance): AcceptanceStatus
    {
        if ($acceptance->status !== AcceptanceStatus::PENDING) {
            return $acceptance->status;
        }

        if (!$acceptance->referred) {
            return AcceptanceStatus::WAITING_FOR_PAYMENT;
        }

        if ($this->acceptanceRepository->countSamplableItems($acceptance) > 0) {
            return AcceptanceStatus::SAMPLING;
        }

        return $acceptance->financial_approved
            ? AcceptanceStatus::REPORTED
            : AcceptanceStatus::WAITING_FOR_FINANCIAL_APPROVAL;
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
        DB::transaction(function () use ($acceptance, $publisherId): void {
            // Load acceptance items with reports
            $acceptance->load([
                'acceptanceItems' => function ($q) {
                    $q->where('reportless', false)
                        ->with('report');
                }
            ]);

            $publishedAt = now();
            $publisher = User::find($publisherId);

            // Publish all unpublished reports
            foreach ($acceptance->acceptanceItems as $acceptanceItem) {
                if (!$acceptanceItem->reportless && $acceptanceItem->report && !$acceptanceItem->report->published_at) {
                    $report = $acceptanceItem->report;
                    Report::where("id", $report->id)
                        ->update([
                            'published_at' => $publishedAt,
                            'publisher_id' => $publisherId
                        ]);

                    // Update timeline
                    $this->acceptanceItemService->updateAcceptanceItemTimeline(
                        $acceptanceItem,
                        "Report Published By {$publisher->name}"
                    );
                }
            }
        });

        // Check if all tests are published and send notifications — the
        // listeners notify externally, so this stays outside the transaction.
        $this->checkAcceptanceReport($acceptance, $silentlyPublish);

        return $acceptance->fresh();
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
                    (int)$acceptance_item['method_test']['id'],
                    (float)$acceptance_item["price"],
                    (float)$acceptance_item['discount'],
                    array_merge(($acceptance_item["customParameters"] ?? []), Arr::except($acceptance_item, ["method_test", "price", "discount", "patients", "timeLine", "id", "customParameters", "sampleless"])),
                    !($acceptance_item['timeLine'] ?? null) ? [
                        Carbon::now()->format("Y-m-d H:i:s") => "Created By " . auth()->user()->name,
                    ] : [
                        ...$acceptance_item['timeLine'],
                        Carbon::now()->format("Y-m-d H:i:s") => "Edited By " . auth()->user()->name,
                    ],
                    $isService ? 0 : (int)($acceptance_item["no_sample"] ?? 1),
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
                    $panelID = Str::uuid()->toString();
                    $panelSampleless = $panelData["sampleless"] ?? false;
                    $panelReportless = $panelData["reportless"] ?? false;
                    // Split the panel totals so the item shares add back up to the
                    // panel price/discount even when they do not divide evenly.
                    $panelItemCount = count($panelData["acceptanceItems"]);
                    $panelPrices = AmountDistributor::distribute(
                        (float)$panelData['price'],
                        $panelItemCount,
                        AmountDistributor::PRICE_DECIMALS
                    );
                    $panelDiscounts = AmountDistributor::distribute(
                        (float)$panelData['discount'],
                        $panelItemCount,
                        AmountDistributor::DISCOUNT_DECIMALS
                    );
                    foreach (array_values($panelData["acceptanceItems"]) as $itemIndex => $item) {
                        $itemSampleless = $panelSampleless || ($item["sampleless"] ?? false);
                        $isService = ($item['method_test']['test']['type'] ?? null) === TestType::SERVICE->value;
                        $output[] = new AcceptanceItemDTO(
                            $acceptance->id,
                            (int)$item['method_test']['id'],
                            $panelPrices[$itemIndex],
                            $panelDiscounts[$itemIndex],
                            array_merge(($item["customParameters"] ?? []), Arr::except($item, ["method_test", "price", "discount", "patients", "timeLine", "id", "customParameters", "sampleless"])),
                            !($item['timeLine'] ?? null) ? [
                                Carbon::now()->format("Y-m-d H:i:s") => "Created By " . auth()->user()->name,
                            ] : [
                                ...$item['timeLine'],
                                Carbon::now()->format("Y-m-d H:i:s") => "Edited By " . auth()->user()->name,
                            ],
                            $isService ? 0 : (int)($item["no_sample"] ?? 1),
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
        // The AcceptanceCancelledEvent listener cancels the invoice with a
        // synchronous DB write, so the dispatch belongs inside the transaction.
        DB::transaction(function () use ($acceptance): void {
            $this->acceptanceRepository->updateAcceptance($acceptance, [
                "status" => AcceptanceStatus::CANCELLED
            ]);
            $acceptance->acceptanceItemStates()->update(["status" => AcceptanceItemStateStatus::REJECTED]);
            AcceptanceCardReleasedEvent::dispatch($acceptance->id, 'Acceptance cancelled');
            if ($acceptance->invoice_id) {
                AcceptanceCancelledEvent::dispatch($acceptance->invoice_id);
            }
        });
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
