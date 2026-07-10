<?php

declare(strict_types=1);

namespace App\Domains\Notification\Jobs;

use App\Domains\Document\Models\Document;
use App\Domains\Laboratory\Models\ConsentForm;
use Illuminate\Database\Eloquent\Model;

class SendConsentFormUpdateWebhook extends AbstractSendEntityUpdateWebhook
{
    public function __construct(protected ConsentForm $consentForm, string $action)
    {
        $this->action = $action;
    }

    protected function entity(): Model
    {
        return $this->consentForm;
    }

    protected function entityKey(): string
    {
        return 'consent_form';
    }

    protected function urlConfigKey(): string
    {
        return 'consent_form_webhook_url';
    }

    protected function document(): ?Document
    {
        $this->consentForm->loadMissing('document');

        return $this->consentForm->document;
    }
}
