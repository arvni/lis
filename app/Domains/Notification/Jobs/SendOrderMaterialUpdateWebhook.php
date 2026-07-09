<?php

declare(strict_types=1);

namespace App\Domains\Notification\Jobs;

use App\Domains\Referrer\Models\OrderMaterial;

class SendOrderMaterialUpdateWebhook extends AbstractSendWebhook
{
    public function __construct(protected OrderMaterial $orderMaterial) {}

    protected function payload(): array
    {
        $this->orderMaterial->loadMissing('materials.sampleType');

        return [
            'order_id' => $this->orderMaterial->server_id,
            'status' => $this->orderMaterial->status,
            'updated_at' => $this->orderMaterial->updated_at?->toISOString(),
            'materials' => $this->orderMaterial->materials->toArray(),
        ];
    }

    protected function webhookUrl(): string
    {
        return $this->joinUrl(
            (string) config('services.provider_app.webhook_domain'),
            (string) config('services.provider_app.order_material_webhook_url'),
            $this->orderMaterial->server_id
        );
    }

    protected function logContext(): array
    {
        return ['order_id' => $this->orderMaterial->id];
    }
}
