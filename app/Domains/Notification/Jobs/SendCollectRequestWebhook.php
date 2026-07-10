<?php

declare(strict_types=1);

namespace App\Domains\Notification\Jobs;

use App\Domains\Referrer\Models\CollectRequest;

class SendCollectRequestWebhook extends AbstractSendWebhook
{
    public function __construct(protected ?int $id = null, protected string $action = 'update') {}

    protected function payload(): array
    {
        if ($this->action === 'delete') {
            return ['id' => $this->id];
        }

        $collectRequest = CollectRequest::where('id', $this->id)
            ->with(['sampleCollector', 'referrer'])
            ->firstOrFail();

        return [
            'id' => $collectRequest->id,
            'action' => $this->action,
            'status' => $collectRequest->status?->value,
            'sample_collector' => [
                'id' => $collectRequest->sampleCollector?->id,
                'name' => $collectRequest->sampleCollector?->name,
                'email' => $collectRequest->sampleCollector?->email,
            ],
            'preferred_date' => $collectRequest->preferred_date,
            'referrer' => [
                'id' => $collectRequest->referrer?->id,
                'name' => $collectRequest->referrer?->name ?? $collectRequest->referrer?->fullName,
                'email' => $collectRequest->referrer?->email,
                'phone' => $collectRequest->referrer?->phoneNo,
                ...($collectRequest->referrer?->logisticInfo ?? []),
            ],
            'logistic_information' => $collectRequest->logistic_information,
            'created_at' => $collectRequest->created_at?->toISOString(),
            'updated_at' => $collectRequest->updated_at?->toISOString(),
        ];
    }

    protected function webhookUrl(): string
    {
        return $this->joinUrl(
            (string) config('services.logistics_app.webhook_domain'),
            (string) config('services.logistics_app.collect_request_webhook_url')
        );
    }

    protected function serviceConfig(): string
    {
        return 'services.logistics_app';
    }

    protected function headers(): array
    {
        return ['X-Webhook-Action' => $this->action];
    }

    protected function logContext(): array
    {
        return ['collect_request_id' => $this->id, 'action' => $this->action];
    }
}
