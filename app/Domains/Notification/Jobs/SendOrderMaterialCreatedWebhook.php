<?php

declare(strict_types=1);

namespace App\Domains\Notification\Jobs;

use App\Domains\Referrer\Models\OrderMaterial;
use Illuminate\Support\Facades\Log;

class SendOrderMaterialCreatedWebhook extends AbstractSendWebhook
{
    public function __construct(protected int $orderMaterialId) {}

    protected function payload(): ?array
    {
        $orderMaterial = OrderMaterial::with([
            'referrer',
            'sampleType',
            'materials',
        ])->find($this->orderMaterialId);

        if (! $orderMaterial) {
            Log::warning("SendOrderMaterialCreatedWebhook: OrderMaterial #{$this->orderMaterialId} not found");

            return null;
        }

        return [
            'order_material' => [
                'id' => $orderMaterial->id,
                'status' => $orderMaterial->status,
                'amount' => $orderMaterial->amount,
                'created_at' => $orderMaterial->created_at?->toISOString(),
                'referrer' => $orderMaterial->referrer ? [
                    'id' => $orderMaterial->referrer->id,
                    'fullName' => $orderMaterial->referrer->fullName,
                ] : null,
                'sample_type' => $orderMaterial->sampleType ? [
                    'id' => $orderMaterial->sampleType->id,
                    'name' => $orderMaterial->sampleType->name,
                ] : null,
                'materials' => $orderMaterial->materials->map(fn ($m) => [
                    'id' => $m->id,
                    'barcode' => $m->barcode,
                    'tube_barcode' => $m->tube_barcode,
                    'packing_series' => $m->packing_series,
                    'expire_date' => $m->expire_date?->format('Y-m-d'),
                    'assigned_at' => $m->assigned_at,
                ])->values()->toArray(),
            ],
        ];
    }

    protected function webhookUrl(): string
    {
        // POST to the base URL (no server_id — this is creation, not update)
        return $this->joinUrl(
            (string) config('services.provider_app.webhook_domain'),
            (string) config('services.provider_app.order_material_webhook_url')
        );
    }

    protected function headers(): array
    {
        return ['Content-Type' => 'application/json'];
    }

    protected function logContext(): array
    {
        return ['order_material_id' => $this->orderMaterialId];
    }
}
