<?php

namespace App\Domains\Notification\Jobs;

use App\Domains\Referrer\Models\OrderMaterial;
use Exception;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class SendOrderMaterialUpdateWebhook implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3; // Retry 3 times if failed
    public array $backoff = [10, 30, 60]; // Wait times between retries

    protected OrderMaterial $orderMaterial;

    public function __construct(OrderMaterial $orderMaterial)
    {
        $this->orderMaterial = $orderMaterial;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $webhookDomain = config('services.provider_app.webhook_domain');
        $webhookUrl = config('services.provider_app.order_material_webhook_url');
        $secret = config('services.provider_app.webhook_secret');
        $this->orderMaterial->load("materials.sampleType");
        $payload = [
            'order_id' => $this->orderMaterial->server_id,
            'status' => $this->orderMaterial->status,
            'updated_at' => $this->orderMaterial?->updated_at?->toISOString(),
            'materials' => $this->orderMaterial?->materials?->toArray()
        ];
        $webhookUrl = (Str::endsWith($webhookDomain, '/') ? Str::substr($webhookDomain,0,-1) : $webhookDomain) .  (Str::endsWith($webhookUrl, '/') ? $webhookUrl : $webhookUrl . "/") . $this->orderMaterial->server_id;
        $signature = hash_hmac('sha256', json_encode($payload), $secret);
        Log::debug("Webhook URL: " . $webhookUrl);

        try {
            $response = Http::timeout(30)
                ->withHeaders(['X-Webhook-Signature' => $signature])
                ->post($webhookUrl, $payload);

            if (!$response->successful()) {
                throw new Exception("Webhook failed with status: " . $response->status());
            }

            Log::info("Order webhook sent successfully", ['order_id' => $this->orderMaterial->id]);

        } catch (Exception $e) {
            Log::error("Order webhook failed", [
                'order_id' => $this->orderMaterial->id,
                'error' => $e->getMessage()
            ]);
            throw $e; // This will trigger retry
        }
    }
}
