<?php

namespace App\Domains\Referrer\Listeners;

use App\Domains\Reception\Models\Acceptance;
use App\Domains\Referrer\Events\ReferrerOrderCreated;
use App\Domains\Referrer\Support\ReferrerOrderPayloadBuilder;
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
                'acceptance_id'     => $referrerOrder->acceptance_id,
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

        $referrerOrder->loadMissing('collectRequest.sampleCollector');

        $webhookDomain = config('services.provider_app.webhook_domain');
        $webhookUrl    = config('services.provider_app.acceptance_webhook_url', '/api/orders/webhook');
        $secret        = config('services.provider_app.webhook_secret');

        $payload = ReferrerOrderPayloadBuilder::build($acceptance, $referrerOrder);

        if (empty($payload['order']['orderItems'])) {
            Log::info("SendReferrerOrderWebhook: skipped — no sendable order items", [
                'referrer_order_id' => $referrerOrder->id,
                'acceptance_id'     => $acceptance->id,
            ]);
            return;
        }

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
}
