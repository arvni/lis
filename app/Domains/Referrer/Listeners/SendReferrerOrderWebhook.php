<?php

namespace App\Domains\Referrer\Listeners;

use App\Domains\Reception\Enums\AcceptanceStatus;
use App\Domains\Reception\Models\Acceptance;
use App\Domains\Referrer\Events\ReferrerOrderCreated;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class SendReferrerOrderWebhook implements ShouldQueue
{
    use InteractsWithQueue;

    public int $tries = 3;
    public array $backoff = [10, 30, 60];
    public array $genderMap = [
        'male'   => 1,
        'female' => 0,
    ];

    public function handle(ReferrerOrderCreated $event): void
    {
        $referrerOrder = $event->referrerOrder;

        if (!$referrerOrder->acceptance_id) {
            Log::info("SendReferrerOrderWebhook: skipped — no acceptance linked", [
                'referrer_order_id' => $referrerOrder->id,
            ]);
            return;
        }

        $acceptance = Acceptance::with([
            'patient',
            'referrer',
            'acceptanceItems.methodTest.test',
            'acceptanceItems.patients',
            'acceptanceItems.samples.sampleType',
        ])->find($referrerOrder->acceptance_id);

        if (!$acceptance) {
            Log::warning("SendReferrerOrderWebhook: acceptance not found", [
                'acceptance_id'    => $referrerOrder->acceptance_id,
                'referrer_order_id' => $referrerOrder->id,
            ]);
            return;
        }

        if (!$acceptance->referrer_id) {
            Log::info("SendReferrerOrderWebhook: skipped — acceptance has no referrer", [
                'acceptance_id' => $acceptance->id,
            ]);
            return;
        }

        $webhookDomain = config('services.provider_app.webhook_domain');
        $webhookUrl    = config('services.provider_app.acceptance_webhook_url', '/api/orders/webhook');
        $secret        = config('services.provider_app.webhook_secret');

        $payload = $this->buildPayload($acceptance, $referrerOrder->id);

        $fullWebhookUrl = (Str::endsWith($webhookDomain, '/') ? Str::substr($webhookDomain, 0, -1) : $webhookDomain)
            . (Str::startsWith($webhookUrl, '/') ? $webhookUrl : '/' . $webhookUrl);

        $signature = hash_hmac('sha256', json_encode($payload), $secret);

        Log::debug("SendReferrerOrderWebhook URL: " . $fullWebhookUrl);

        try {
            $response = Http::timeout(30)
                ->withHeaders([
                    'X-Webhook-Signature' => $signature,
                    'Content-Type'        => 'application/json',
                ])
                ->post($fullWebhookUrl, $payload);

            if (!$response->successful()) {
                throw new \Exception("Webhook failed with status: " . $response->status() . " - " . $response->body());
            }

            Log::info("SendReferrerOrderWebhook sent successfully", [
                'referrer_order_id' => $referrerOrder->id,
                'acceptance_id'     => $acceptance->id,
            ]);

        } catch (\Exception $e) {
            Log::error("SendReferrerOrderWebhook failed", [
                'referrer_order_id' => $referrerOrder->id,
                'acceptance_id'     => $acceptance->id,
                'error'             => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    private function buildPayload(Acceptance $acceptance, int $referrerOrderId): array
    {
        $mainPatient = $acceptance->patient;

        $allPatients = collect([$mainPatient]);
        foreach ($acceptance->acceptanceItems as $item) {
            foreach ($item->patients as $patient) {
                if (!$allPatients->contains('id', $patient->id)) {
                    $allPatients->push($patient);
                }
            }
        }

        $orderItems = [];
        foreach ($acceptance->acceptanceItems as $item) {
            $test = $item->methodTest?->test;
            if (!$test || $item->reportless) {
                continue;
            }

            $samples = [];
            foreach ($item->samples as $sample) {
                $samples[] = [
                    'id'             => $sample->id,
                    'sampleId'       => $sample->barcode,
                    'patientId'      => $sample->patient_id,
                    'collectionDate' => $sample->collection_date,
                    'sample_type_id' => $sample->sample_type_id,
                    'sampleType'     => [
                        'id'   => $sample->sampleType?->id,
                        'name' => $sample->sampleType?->name ?? 'Unknown',
                    ],
                ];
            }

            $itemPatients = [];
            foreach ($item->patients as $patient) {
                $itemPatients[] = [
                    'id'          => (string) $patient->id,
                    'fullName'    => $patient->fullName,
                    'gender'      => $this->genderMap[$patient->gender] ?? -1,
                    'id_no'       => $patient->idNo,
                    'nationality' => $patient->nationality,
                    'dateOfBirth' => $patient->dateOfBirth,
                    'is_main'     => $patient->id === $mainPatient->id,
                ];
            }

            $existingKey = collect($orderItems)->search(
                fn($o) => $o['id'] == ($item->panel_id ?? $item->id)
            );

            if ($existingKey !== false) {
                $orderItems[$existingKey]['patients'] = collect($orderItems[$existingKey]['patients'])
                    ->merge($itemPatients)->unique('id')->values()->all();
                $orderItems[$existingKey]['samples'] = collect($orderItems[$existingKey]['samples'])
                    ->merge($samples)->unique('id')->values()->all();
            } else {
                $orderItems[] = [
                    'id'      => $item->panel_id ?? $item->id,
                    'test_id' => $test->id,
                    'test'    => [
                        'id'   => $test->id,
                        'name' => $test->name,
                        'code' => $test->code ?? '',
                    ],
                    'samples'  => $samples,
                    'patients' => $itemPatients,
                ];
            }
        }

        return [
            'order' => [
                'id'               => $acceptance->id,
                'referrer_order_id' => $referrerOrderId,
                'status'           => $acceptance->status !== AcceptanceStatus::REPORTED
                    ? AcceptanceStatus::PROCESSING
                    : AcceptanceStatus::REPORTED,
                'orderForms'  => null,
                'consents'    => null,
                'files'       => null,
                'main_patient' => [
                    'id'           => $mainPatient->id,
                    'fullName'     => $mainPatient->fullName,
                    'nationality'  => $mainPatient->nationality ?? 'Unknown',
                    'dateOfBirth'  => $mainPatient->dateOfBirth?->format('Y-m-d'),
                    'gender'       => $this->genderMap[$mainPatient->gender] ?? -1,
                    'reference_id' => $acceptance->referenceCode,
                    'id_no'        => $mainPatient->idNo,
                ],
                'patients'   => $allPatients->map(fn($p) => [
                    'id'          => (string) $p->id,
                    'fullName'    => $p->fullName,
                    'id_no'       => $p->idNo,
                    'nationality' => $p->nationality,
                    'dateOfBirth' => $p->dateOfBirth?->format('Y-m-d'),
                    'gender'      => $this->genderMap[$p->gender] ?? -1,
                ])->toArray(),
                'orderItems' => $orderItems,
                'created_at' => $acceptance->created_at,
                'updated_at' => $acceptance->updated_at,
            ],
            'referrer_id' => $acceptance->referrer_id,
        ];
    }
}
