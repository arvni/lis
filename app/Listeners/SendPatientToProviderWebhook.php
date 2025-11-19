<?php

namespace App\Listeners;

use App\Events\ReferrerOrderPatientCreated;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class SendPatientToProviderWebhook implements ShouldQueue
{
    use InteractsWithQueue;

    public int $tries = 3;
    public array $backoff = [10, 30, 60];

    /**
     * Create the event listener.
     */
    public function __construct()
    {
        //
    }

    /**
     * Handle the event.
     */
    public function handle(ReferrerOrderPatientCreated $event): void
    {
        $webhookDomain = config('services.provider_app.webhook_domain');
        $webhookUrl = config('services.provider_app.patient_webhook_url', '/api/patients/webhook');
        $secret = config('services.provider_app.webhook_secret');

        $patient = $event->patient;
        $referrerOrder = $event->referrerOrder;

        // Build payload
        $payload = [
            'order_id' => $referrerOrder->order_id,
            'patient' => [
                'id' => $patient->id, // Local system ID (server_id for provider)
                'fullName' => $patient->fullName,
                'idNo' => $patient->idNo,
                'nationality' => $patient->nationality,
                'dateOfBirth' => $patient->dateOfBirth?->format('Y-m-d'),
                'gender' => $patient->gender,
                'phone' => $patient->phone,
                'is_main' => $event->isMainPatient
            ],
            'referrer_id' => $referrerOrder->referrer_id
        ];

        // Build full webhook URL
        $fullWebhookUrl = (Str::endsWith($webhookDomain, '/') ? Str::substr($webhookDomain, 0, -1) : $webhookDomain)
            . (Str::startsWith($webhookUrl, '/') ? $webhookUrl : '/' . $webhookUrl);

        // Create HMAC signature
        $signature = hash_hmac('sha256', json_encode($payload), $secret);

        Log::debug("Patient Webhook URL: " . $fullWebhookUrl);

        try {
            $response = Http::timeout(30)
                ->withHeaders([
                    'X-Webhook-Signature' => $signature,
                    'Content-Type' => 'application/json'
                ])
                ->post($fullWebhookUrl, $payload);

            if (!$response->successful()) {
                throw new \Exception("Webhook failed with status: " . $response->status() . " - " . $response->body());
            }

            Log::info("Patient webhook sent successfully", [
                'referrer_order_id' => $referrerOrder->id,
                'patient_id' => $patient->id
            ]);

        } catch (\Exception $e) {
            Log::error("Patient webhook failed", [
                'referrer_order_id' => $referrerOrder->id,
                'patient_id' => $patient->id,
                'error' => $e->getMessage()
            ]);
            throw $e; // This will trigger retry
        }
    }
}
