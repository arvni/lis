<?php

declare(strict_types=1);

namespace App\Domains\Notification\Jobs;

use App\Domains\Laboratory\Models\SampleType;
use Illuminate\Database\Eloquent\Model;

class SendSampleTypeUpdateWebhook extends AbstractSendEntityUpdateWebhook
{
    public function __construct(protected SampleType $sampleType, string $action)
    {
        $this->action = $action;
    }

    protected function entity(): Model
    {
        return $this->sampleType;
    }

    protected function entityKey(): string
    {
        return 'sample_type';
    }

    protected function urlConfigKey(): string
    {
        return 'sample_type_webhook_url';
    }
}
