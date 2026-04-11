<?php

namespace App\Domains\Notification\Jobs;

use App\Domains\Referrer\Models\OrderMaterial;
use Exception;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class SendOrderMaterialCreatedWebhook implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public array $backoff = [10, 30, 60];

    public function __construct(protected int $orderMaterialId)
    {
    }

    public function handle(): void
    {
        $orderMaterial = OrderMaterial::with([
            'referrer',
            'sampleType',
            'materials',
        ])->find($this->orderMaterialId);

        if (!$orderMaterial) {
            Log::warning("SendOrderMaterialCreatedWebhook: OrderMaterial #{$this->orderMaterialId} not found");
            return;
        }

        $webhookDomain = config('services.provider_app.webhook_domain');
        $webhookUrl    = config('services.provider_app.order_material_webhook_url');
        $secret        = config('services.provider_app.webhook_secret');

        $payload = $this->buildPayload($orderMaterial);

        // POST to the base URL (no server_id — this is creation, not update)
        $fullUrl = rtrim(
            Str::endsWith($webhookDomain, '/') ? Str::substr($webhookDomain, 0, -1) : $webhookDomain, '/'
        ) . '/' . ltrim($webhookUrl, '/');

        $signature = hash_hmac('sha256', json_encode($payload), $secret);

        Log::debug("SendOrderMaterialCreatedWebhook URL: {$fullUrl}");

        try {
            $response = Http::timeout(30)
                ->withHeaders([
                    'X-Webhook-Signature' => $signature,
                    'Content-Type'        => 'application/json',
                ])
                ->post($fullUrl, $payload);

            if (!$response->successful()) {
                throw new Exception(
                    "Webhook failed with status: {$response->status()} — {$response->body()}"
                );
            }

            Log::info("SendOrderMaterialCreatedWebhook sent successfully", [
                'order_material_id' => $orderMaterial->id,
            ]);

        } catch (Exception $e) {
            Log::error("SendOrderMaterialCreatedWebhook failed", [
                'order_material_id' => $this->orderMaterialId,
                'error'             => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    private function buildPayload(OrderMaterial $orderMaterial): array
    {
        return [
            'order_material' => [
                'id'         => $orderMaterial->id,
                'status'     => $orderMaterial->status,
                'amount'     => $orderMaterial->amount,
                'created_at' => $orderMaterial->created_at?->toISOString(),
                'referrer'   => $orderMaterial->referrer ? [
                    'id'       => $orderMaterial->referrer->id,
                    'fullName' => $orderMaterial->referrer->fullName,
                ] : null,
                'sample_type' => $orderMaterial->sampleType ? [
                    'id'   => $orderMaterial->sampleType->id,
                    'name' => $orderMaterial->sampleType->name,
                ] : null,
                'materials' => $orderMaterial->materials->map(fn($m) => [
                    'id'             => $m->id,
                    'barcode'        => $m->barcode,
                    'tube_barcode'   => $m->tube_barcode,
                    'packing_series' => $m->packing_series,
                    'expire_date'    => $m->expire_date?->format('Y-m-d'),
                    'assigned_at'    => $m->assigned_at,
                ])->values()->toArray(),
            ],
        ];
    }
}
