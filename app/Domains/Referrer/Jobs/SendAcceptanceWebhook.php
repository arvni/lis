<?php

namespace App\Domains\Referrer\Jobs;

use App\Domains\Laboratory\Enums\TestType;
use App\Domains\Reception\Enums\AcceptanceStatus;
use App\Domains\Reception\Models\Acceptance;
use Exception;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class SendAcceptanceWebhook implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3; // Retry 3 times if failed
    public array $backoff = [10, 30, 60]; // Wait times between retries
    public array $genderMap = [
        'male' => 1,
        'female' => 0
    ];

    protected int $acceptanceId;

    public function __construct(int $acceptanceId)
    {
        $this->acceptanceId = $acceptanceId;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $webhookDomain = config('services.provider_app.webhook_domain');
        $webhookUrl = config('services.provider_app.acceptance_webhook_url', '/api/orders/webhook');
        $secret = config('services.provider_app.webhook_secret');

        // Load acceptance with all necessary relationships
        $acceptance = Acceptance::with([
            'patient',
            'referrer',
            'acceptanceItems.methodTest.test',
            'acceptanceItems.patients',
            'acceptanceItems.samples.sampleType'
        ])
            ->find($this->acceptanceId);

        if (!$acceptance) {
            throw new Exception("Acceptance #{$this->acceptanceId} not found");
        }

        if (!$acceptance->referrer) {
            throw new Exception("Acceptance #{$this->acceptanceId} has no referrer");
        }

        // Build payload according to the validation structure
        $payload = $this->buildPayload($acceptance);

        // Build the full webhook URL
        $fullWebhookUrl = (Str::endsWith($webhookDomain, '/') ? Str::substr($webhookDomain, 0, -1) : $webhookDomain)
            . (Str::startsWith($webhookUrl, '/') ? $webhookUrl : '/' . $webhookUrl);

        // Create signature for security
        $signature = hash_hmac('sha256', json_encode($payload), $secret);

        Log::debug("Acceptance Webhook URL: " . $fullWebhookUrl);

        try {
            $response = Http::timeout(30)
                ->withHeaders([
                    'X-Webhook-Signature' => $signature,
                    'Content-Type' => 'application/json'
                ])
                ->post($fullWebhookUrl, $payload);

            if (!$response->successful()) {
                throw new Exception("Webhook failed with status: " . $response->status() . " - " . $response->body());
            }

            Log::info("Acceptance webhook sent successfully", [
                'acceptance_id' => $this->acceptanceId,
                'referrer_id' => $acceptance->referrer_id
            ]);

        } catch (Exception $e) {
            Log::error("Acceptance webhook failed", [
                'acceptance_id' => $this->acceptanceId,
                'referrer_id' => $acceptance->referrer_id ?? null,
                'error' => $e->getMessage()
            ]);
            throw $e; // This will trigger retry
        }
    }

    /**
     * Build the webhook payload matching the expected validation structure
     */
    private function buildPayload(Acceptance $acceptance): array
    {
        // Build main patient data
        $mainPatient = $acceptance->patient;

        // Collect all unique patients from acceptance items
        $allPatients = collect([$mainPatient]);
        foreach ($acceptance->acceptanceItems as $item) {
            foreach ($item->patients as $patient) {
                if (!$allPatients->contains('id', $patient->id)) {
                    $allPatients->push($patient);
                }
            }
        }

        // Build order items
        $orderItems = [];
        foreach ($acceptance->acceptanceItems as $item) {
            $test = $item->methodTest?->test;
            if (!$test || $item->reportless) {
                continue; // Skip reportless items
            }

            // Get samples for this item
            $samples = [];
            foreach ($item->samples as $sample) {
                $samples[] = [
                    "id" => $sample->id,
                    'sampleId' => $sample->barcode,
                    'patientId' => $sample->patient_id,
                    'collectionDate' => $sample->collection_date,
                    'sample_type_id' => $sample->sample_type_id,
                    'sampleType' => [
                        'id' => $sample->sampleType?->id,
                        'name' => $sample->sampleType?->name ?? 'Unknown'
                    ]
                ];
            }

            // Get patients for this item
            $itemPatients = [];
            foreach ($item->patients as $patient) {
                $isMain = $patient->id === $mainPatient->id;
                $itemPatients[] = [
                    'id' => (string)$patient->id,
                    'fullName' => $patient->fullName,
                    'gender' => $this->genderMap[$patient->gender] ?? -1,
                    'id_no' => $patient->idNo,
                    'nationality' => $patient->nationality,
                    'dateOfBirth' => $patient->dateOfBirth,
                    'is_main' => $isMain
                ];
            }
            // Check if the item already exists in $orderItems
            $existingItemKey = collect($orderItems)->search(function ($orderItem) use ($item) {
                return $orderItem['id'] == ($item->panel_id ?? $item->id);
            });

            if ($existingItemKey !== false) {
                // Merge patients without duplicates
                $orderItems[$existingItemKey]['patients'] = collect($orderItems[$existingItemKey]['patients'])
                    ->merge($itemPatients)
                    ->unique('id') // assuming patients have an 'id' field
                    ->values()
                    ->all();

                // Merge samples without duplicates
                $orderItems[$existingItemKey]['samples'] = collect($orderItems[$existingItemKey]['samples'])
                    ->merge($samples)
                    ->unique('id') // assuming samples have an 'id' field
                    ->values()
                    ->all();
            } else {
                // Add a new item
                $orderItems[] = [
                    'id' => $item->panel_id ?? $item->id,
                    'test_id' => $test->id,
                    'test' => [
                        'id' => $test->id,
                        'name' => $test->name,
                        'code' => $test->code ?? ''
                    ],
                    'samples' => $samples,
                    'patients' => $itemPatients
                ];
            }

        }

        return [
            'order' => [
                'id' => $acceptance->id,
                'status' => $acceptance->status !== AcceptanceStatus::REPORTED ? AcceptanceStatus::PROCESSING : AcceptanceStatus::REPORTED,
                'orderForms' => null,
                'consents' => null,
                'files' => null,

                // Main patient
                'main_patient' => [
                    'id' => $mainPatient->id,
                    'fullName' => $mainPatient->fullName,
                    'nationality' => $mainPatient->nationality ?? 'Unknown',
                    'dateOfBirth' => $mainPatient->dateOfBirth?->format('Y-m-d'),
                    'gender' => $this->genderMap[$mainPatient->gender] ?? -1,
                    'reference_id' => $acceptance->referenceCode,
                    'id_no' => $mainPatient->idNo
                ],

                // All patients
                'patients' => $allPatients->map(fn($patient) => [
                    'id' => (string)$patient->id,
                    'fullName' => $patient->fullName,
                    'id_no' => $patient->idNo,
                    'nationality' => $patient->nationality,
                    'dateOfBirth' => $patient->dateOfBirth?->format('Y-m-d'),
                    'gender' => $this->genderMap[$patient->gender] ?? -1,
                ])->toArray(),

                // Order items
                'orderItems' => $orderItems,
                "created_at" => $acceptance->created_at,
                "updated_at" => $acceptance->updated_at,
            ],

            // Referrer ID (required by validation)
            'referrer_id' => $acceptance->referrer_id
        ];
    }
}
