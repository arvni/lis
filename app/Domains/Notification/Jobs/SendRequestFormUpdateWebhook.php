<?php

declare(strict_types=1);

namespace App\Domains\Notification\Jobs;

use App\Domains\Document\Models\Document;
use App\Domains\Laboratory\Models\RequestForm;
use Illuminate\Database\Eloquent\Model;

class SendRequestFormUpdateWebhook extends AbstractSendEntityUpdateWebhook
{
    public function __construct(protected RequestForm $requestForm, string $action)
    {
        $this->action = $action;
    }

    protected function entity(): Model
    {
        return $this->requestForm;
    }

    protected function entityKey(): string
    {
        return 'request_form';
    }

    protected function urlConfigKey(): string
    {
        return 'request_form_webhook_url';
    }

    protected function document(): ?Document
    {
        $this->requestForm->loadMissing('document');

        return $this->requestForm->document;
    }
}
