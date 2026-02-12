<?php

namespace App\Domains\Reception\Services;


use App\Domains\Billing\Enums\InvoiceStatus;
use App\Domains\Document\Enums\DocumentTag;
use App\Domains\Laboratory\Enums\TestType;
use App\Domains\Notification\Enums\WhatsappMessageType;
use App\Domains\Notification\Enums\WhatsappMessageWritten;
use App\Domains\Notification\Models\WhatsappMessage;
use App\Domains\Reception\Adapters\LaboratoryAdapter;
use App\Domains\Reception\DTOs\AcceptanceDTO;
use App\Domains\Reception\DTOs\AcceptanceItemDTO;
use App\Domains\Reception\Enums\AcceptanceItemStateStatus;
use App\Domains\Reception\Enums\AcceptanceStatus;
use App\Domains\Reception\Events\AcceptanceDeletedEvent;
use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Models\Patient;
use App\Domains\Reception\Models\Report;
use App\Domains\Reception\Notifications\PatientReportPublished;
use App\Domains\Reception\Repositories\AcceptanceRepository;
use App\Domains\Referrer\Models\Referrer;
use App\Domains\Referrer\Services\ReferrerOrderService;
use App\Domains\Setting\Repositories\SettingRepository;
use App\Domains\User\Models\User;
use App\Notifications\ReferrerReportPublished;
use Carbon\Carbon;
use Exception;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;
use Throwable;

class AcceptanceService
{
    protected string $phonePattern = "/^((\+|00)?968)?[279]\d{7}$/i";

    public function __construct(
        private readonly AcceptanceRepository  $acceptanceRepository,
        private readonly AcceptanceItemService $acceptanceItemService,
        private readonly LaboratoryAdapter     $laboratoryAdapter,
        private readonly SettingRepository     $settingRepository,
        private readonly ReferrerOrderService  $referrerOrderService,
    )
    {
    }

    public function listAcceptances($queryData): LengthAwarePaginator
    {
        return $this->acceptanceRepository->ListAcceptances($queryData);
    }

    public function getReferrerAcceptanceReported($referrer_id, $date)
    {
        return $this->acceptanceRepository->getReported($referrer_id, $date);
    }

    public function listSampleCollections($queryData): LengthAwarePaginator
    {
        return $this->acceptanceRepository->listSampleCollection($queryData);
    }

    public function listWaitingForPublish($queryData): LengthAwarePaginator
    {
        return $this->acceptanceRepository->listWaitingForPublish($queryData);
    }

    public function listWaitingForFinancialCheck($queryData): LengthAwarePaginator
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
            $test = $this->settingRepository->getSettingsByClassAndKey("Acceptance", "defaultConsultationMethod");
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
            "sampler:name,id"
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
    }

    /**
     * Process and update sampling and delivery data
     *
     * @param Acceptance $acceptance
     * @param AcceptanceDTO $acceptanceDTO
     * @return void
     */
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

    public function getAcceptanceById($id): ?Acceptance
    {
        return $this->acceptanceRepository->getAcceptanceById($id);
    }

    public function updateAcceptanceInvoice(Acceptance $acceptance, $invoiceId): void
    {
        $this->acceptanceRepository->updateAcceptance($acceptance, [
            "invoice_id" => $invoiceId,
            "status" => $acceptance->status == AcceptanceStatus::PENDING ? AcceptanceStatus::WAITING_FOR_PAYMENT : $acceptance->status
        ]);
    }

    public function updateAcceptanceStatus(Acceptance $acceptance, AcceptanceStatus $status): void
    {
        $this->acceptanceRepository->updateAcceptance($acceptance, ["status" => $status]);
        $acceptance->load("referrerOrder");
        if ($acceptance->referrerOrder && $status == AcceptanceStatus::PROCESSING) {
            $this->referrerOrderService->updateReferrerOrderStatus($acceptance->referrerOrder, 'processing');
        }
    }

    public function listBarcodes(Acceptance $acceptance)
    {
        $acceptance->load([
            "acceptanceItems"=>function($query){
                $query->where("sampleless", false);
                $query->with(["method.barcodeGroup","method.test.sampleTypes","test","patients"]);
            },
            "patient"
        ]);
        // Filter out SERVICE type items and sampleless items
        $filteredItems = $acceptance->acceptanceItems->where("test.type", "!=", TestType::SERVICE);
        $barcodes = $this->convertAcceptanceItems($filteredItems);
        return ["barcodes" => $barcodes, "patient" => $acceptance->patient];
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

    /**
     * Check and update acceptance status based on report states
     * Called after report creation or approval
     *
     * @param Acceptance $acceptance
     * @return void
     */
    public function checkAndUpdateAcceptanceStatus(Acceptance $acceptance): void
    {
        // Load acceptance items with reports
        $acceptance->load([
            'acceptanceItems' => function ($q) {
                $q->where('reportless', false)
                    ->with('report');
            }
        ]);

        $reportableItems = $acceptance->acceptanceItems;

        // If no reportable items, check financial approval before setting to REPORTED
        if ($reportableItems->isEmpty()) {
            if ($acceptance->financial_approved) {
                $this->updateAcceptanceStatus($acceptance, AcceptanceStatus::REPORTED);
            } else {
                if ($acceptance->status !== AcceptanceStatus::WAITING_FOR_PUBLISHING) {
                    $this->updateAcceptanceStatus($acceptance, AcceptanceStatus::WAITING_FOR_PUBLISHING);
                }
            }
            return;
        }
        // Check if all reportable items have reports
        $allHaveReports = $reportableItems->every(function ($item) {
            return $item->report !== null;
        });
        if (!$allHaveReports) {
            // Not all items have reports yet, check if items started or should be pooling
            $startedItems = $this->acceptanceRepository->countStartedAcceptanceItems($acceptance);
            if ($startedItems) {
                if ($acceptance->status !== AcceptanceStatus::PROCESSING) {
                    $this->updateAcceptanceStatus($acceptance, AcceptanceStatus::PROCESSING);
                }
            } elseif ($acceptance->waiting_for_pooling && $acceptance->status !== AcceptanceStatus::POOLING) {
                $this->updateAcceptanceStatus($acceptance, AcceptanceStatus::POOLING);
            }
            return;
        }
        // Check if all reports are approved
        $allApproved = $reportableItems->every(function ($item) {
            return $item->report && $item->report->approved_at !== null;
        });

        if ($allApproved) {
            // Check if all are published
            $allPublished = $reportableItems->every(function ($item) {
                return $item->report && $item->report->published_at !== null;
            });

            if ($allPublished) {
                // All reports are published, check financial approval before setting to REPORTED
                if ($acceptance->financial_approved) {
                    if ($acceptance->status !== AcceptanceStatus::REPORTED) {
                        $this->updateAcceptanceStatus($acceptance, AcceptanceStatus::REPORTED);
                    }
                } else {
                    // Stay at WAITING_FOR_PUBLISHING until financial is approved
                    if ($acceptance->status !== AcceptanceStatus::WAITING_FOR_PUBLISHING) {
                        $this->updateAcceptanceStatus($acceptance, AcceptanceStatus::WAITING_FOR_PUBLISHING);
                    }
                }
            } else {
                // All approved but not all published
                if ($acceptance->status !== AcceptanceStatus::WAITING_FOR_PUBLISHING) {
                    $this->updateAcceptanceStatus($acceptance, AcceptanceStatus::WAITING_FOR_PUBLISHING);
                }
            }
        }
    }

    public function checkAcceptanceReport(Acceptance $acceptance, $silent = false): void
    {
        // Check if all tests are published and financial is approved
        if ($this->areAllTestsPublished($acceptance)) {
            if ($acceptance->financial_approved) {
                $this->updateAcceptanceStatus($acceptance, AcceptanceStatus::REPORTED);
                // Send notifications
                $this->sendPublishedNotifications($acceptance, $silent);
            } else {
                // Stay at WAITING_FOR_PUBLISHING until financial is approved
                if ($acceptance->status !== AcceptanceStatus::WAITING_FOR_PUBLISHING) {
                    $this->updateAcceptanceStatus($acceptance, AcceptanceStatus::WAITING_FOR_PUBLISHING);
                }
            }
        }
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
                    $acceptance_item["no_sample"] ?? (count($acceptance_item["samples"] ?? [1]) || 1),
                    $acceptance_item["id"] ?? null,
                    null,
                    $acceptance_item["deleted"] ?? false,
                    $acceptance_item["sampleless"] ?? false,
                );
            }
        }
        if (isset($acceptanceItems['panels']) && is_array($acceptanceItems['panels'])) {
            foreach ($acceptanceItems['panels'] as $panelData) {
                if (isset($panelData["acceptanceItems"]) && is_array($panelData["acceptanceItems"])) {
                    $panelID = Str::uuid();
                    foreach ($panelData["acceptanceItems"] as $item) {
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
                            $item["no_sample"] ?? (count($item["samples"] ?? [1]) || 1),
                            $item["id"] ?? null,
                            $panelID,
                            $panelData["deleted"] ?? false,
                            $item["sampleless"] ?? false,
                        );
                    }
                }
            }
        }
        return $output;
    }

    private function convertAcceptanceItems(Collection $acceptanceItems)
    {
        return $acceptanceItems
            ->flatMap(function ($item) {
                $samples = $item->customParameters['samples'] ?? [];

                if (empty($samples)) {
                    $newModel = $item->replicate();
                    $newModel->id = $item->id;
                    $newModel->created_at = $item->created_at;
                    $newModel->patient = $item->patients->first();
                    return collect([$newModel]);
                }

                return collect($samples)->flatMap(function ($sample, $sampleIndex) use ($item) {
                    try {
                        // If $sample is an array of patient data
                        if (is_array($sample["patients"])) {
                            return collect($sample["patients"])
                                ->map(function ($patientData) use ($item) {
                                    $newModel = $item->replicate();
                                    $newModel->id = $item->id;
                                    $newModel->created_at = $item->created_at;
                                    $patient = $item->patients->where('id', $patientData['id'])->first();
                                    $newModel->patient = $patient;
                                    return $newModel;
                                });
                        } else {
                            // If $sample is a single patient object
                            $newModel = $item->replicate();
                            $newModel->id = $item->id;
                            $newModel->created_at = $item->created_at;
                            $patient = $item->patients->where('id', $sample['id'])->first();
                            $newModel->patient = $patient;
                            return $newModel;
                        }
                    } catch (Exception $exception) {
                        dd($exception, $sampleIndex, $sample, $item->customParameters["samples"]);
                    }
                });
            })
            ->groupBy(function ($item) {
                // Get barcode group ID
                $barcodeGroupId = $item->method->barcode_group_id ?? 'no_barcode_group';
                // Return composite key
                return $barcodeGroupId . '_' . $item->patient->id;
            })
            ->map(function ($item, $key) {
                return [
                    "id" => $key,
                    "barcodeGroup" => $item->first()->method->barcodeGroup,
                    "patient" => $item->first()->patient,
                    "items" => $item,
                    "sampleType" => $item->first()->method->test->sampleTypes
                        ->where('id', $item->first()->customParameters['sampleType'] ?? $item?->first()?->method?->test?->sampleTypes?->first()?->id)
                        ->first(),
                    "collection_date" => Carbon::now("Asia/Muscat")->format("Y-m-d H:i:s"),
                    "sampleLocation" => "In Lab"
                ];
            })
            ->values();
    }


    /**
     * Check if all tests for this acceptance are published
     *
     * @param Acceptance $acceptance
     * @return bool
     */
    private function areAllTestsPublished(Acceptance $acceptance): bool
    {
        $publishedTestsCount = $this->countPublishedTests($acceptance);
        $reportableTestsCount = $this->countReportableTests($acceptance);

        return $publishedTestsCount == $reportableTestsCount;
    }

    /**
     * Count published tests for an acceptance
     *
     * @param Acceptance $acceptance
     * @return int
     */
    private function countPublishedTests(Acceptance $acceptance): int
    {
        return $this->acceptanceRepository->countPublishedTests($acceptance);
    }

    /**
     * Count reportable tests for an acceptance
     *
     * @param Acceptance $acceptance
     * @return int
     */
    private function countReportableTests(Acceptance $acceptance): int
    {
        return $this->acceptanceRepository->countReportableTests($acceptance);
    }


    /**
     * Send notifications about published report
     *
     * @param Acceptance $acceptance
     * @param bool $silent
     * @return void
     */
    private function sendPublishedNotifications(Acceptance $acceptance, bool $silent = false): void
    {
        $acceptance->load([
            "patient",
            "referrer",
            "acceptanceItems" => fn($q) => $q->where("reportless", false)
                ->with("report.publishedDocument", "report.clinicalCommentDocument", "test")
        ]);
        $patient = $acceptance->patient;
        $referrer = $acceptance->referrer;
        if (count($acceptance->acceptanceItems)) {
            $howReport = $acceptance->howReport ?? [];
            // Send notification to patient
            if (!$silent) {
                Notification::send($patient, new PatientReportPublished($acceptance));
                if ($howReport["whatsappNumber"] ?? null) {
                    $to = $this->formatNumber($howReport["whatsappNumber"]);
                    foreach ($acceptance->acceptanceItems as $acceptanceItem) {
                        $data = [
                            'contentSid' => config('services.twilio.templates.send_report_file'),
                            'to' => 'whatsapp:' . $to,
                            'contentVariables' => [
                                "1" => $acceptanceItem->test->name, // {{1}} - Caption
                                "2" => $acceptanceItem->report->publishedDocument->hash, // {{2}} - File
                            ]
                        ];
                        $whatsappMessage = new WhatsappMessage([
                            "data" => $data,
                            "status" => "initial",
                            "waId" => Str::startsWith($to, "+") ? Str::substr($to, 1) : $to,
                            'type' => WhatsappMessageType::OUTBOUND,
                            'written' => WhatsappMessageWritten::TEMPLATE,
                        ]);
                        $whatsappMessage->messageable()->associate($patient);
                        $whatsappMessage->save();

                        if ($acceptanceItem?->report?->clinicalCommentDocument) {
                            $data = [
                                'contentSid' => config('services.twilio.templates.send_report_file'),
                                'to' => 'whatsapp:' . $to,
                                'contentVariables' => [
                                    "1" => $acceptanceItem->test->name . "( Clinical Comment )", // {{1}} - Caption
                                    "2" => $acceptanceItem->report->clinicalCommentDocument->hash, // {{2}} -  File
                                ]
                            ];
                            $whatsappMessage = new WhatsappMessage([
                                "data" => $data,
                                "status" => "initial",
                                "waId" => Str::startsWith($to, "+") ? Str::substr($to, 1) : $to,
                                'type' => WhatsappMessageType::OUTBOUND,
                                'written' => WhatsappMessageWritten::TEMPLATE,
                            ]);
                            $whatsappMessage->messageable()->associate($patient);
                            $whatsappMessage->save();
                        }

                    }
                }
            }

            if (!$silent && $referrer) {
                if ($howReport["sendToReferrer"] ?? false) {
                    // Send notification to referrer
                    $recipients[] = $referrer;
                    if (count($referrer->reportReceivers)) {
                        foreach ($referrer->reportReceivers as $reportReceiver) {
                            $newReferrer = new Referrer();
                            $newReferrer->email = $reportReceiver;
                            $recipients[] = $newReferrer;
                        }
                    }
                    Notification::send($recipients, new ReferrerReportPublished($acceptance));
                    $acceptance->load("referrerOrder");
                    // Update referrer order status
                    if ($acceptance->referrerOrder)
                        $this->referrerOrderService->updateReferrerOrderStatus($acceptance->referrerOrder, 'reported');
                }
            }
        }
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
        $acceptance->invoice()->update(["status" => InvoiceStatus::CANCELED]);
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

    protected function formatNumber($number): string
    {
        // Remove any non-numeric characters except +
        $number = preg_replace('/[^0-9+]/', '', $number);

        if (strlen($number) <= 9)
            $number = '968' . $number;

        // Ensure it has international format
        if (!str_starts_with($number, '+')) {
            $number = '+' . $number;
        }

        return $number;
    }

    public function checkAcceptanceStatus(Acceptance $acceptance): void
    {
        if ($acceptance->status == AcceptanceStatus::REPORTED)
            return;

        $reportableTest = $this->acceptanceRepository->countReportableTests($acceptance);

        if ($reportableTest) {
            $publishedTest = $this->acceptanceRepository->countPublishedTests($acceptance);
            if ($publishedTest == $reportableTest) {
                // All tests are published, check financial approval before setting to REPORTED
                if ($acceptance->financial_approved) {
                    $this->updateAcceptanceStatus($acceptance, AcceptanceStatus::REPORTED);
                } else {
                    // Stay at WAITING_FOR_PUBLISHING until financial is approved
                    if ($acceptance->status !== AcceptanceStatus::WAITING_FOR_PUBLISHING) {
                        $this->updateAcceptanceStatus($acceptance, AcceptanceStatus::WAITING_FOR_PUBLISHING);
                    }
                }
            } else {
                $startedItems = $this->acceptanceRepository->countStartedAcceptanceItems($acceptance);
                if ($startedItems) {
                    $this->updateAcceptanceStatus($acceptance, AcceptanceStatus::PROCESSING);
                } elseif ($acceptance->waiting_for_pooling && $acceptance->status !== AcceptanceStatus::POOLING) {
                    $this->updateAcceptanceStatus($acceptance, AcceptanceStatus::POOLING);
                }
            }
        } else {
            // No reportable tests, check financial approval before setting to REPORTED
            if ($acceptance->financial_approved) {
                $this->updateAcceptanceStatus($acceptance, AcceptanceStatus::REPORTED);
            } else {
                if ($acceptance->status !== AcceptanceStatus::WAITING_FOR_PUBLISHING) {
                    $this->updateAcceptanceStatus($acceptance, AcceptanceStatus::WAITING_FOR_PUBLISHING);
                }
            }
        }
    }


}
