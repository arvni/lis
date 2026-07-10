<?php

declare(strict_types=1);

namespace App\Domains\Notification\Jobs;

use App\Domains\Document\Models\Document;
use App\Domains\Laboratory\Models\Instruction;
use Illuminate\Database\Eloquent\Model;

class SendInstructionUpdateWebhook extends AbstractSendEntityUpdateWebhook
{
    public function __construct(protected Instruction $instruction, string $action)
    {
        $this->action = $action;
    }

    protected function entity(): Model
    {
        return $this->instruction;
    }

    protected function entityKey(): string
    {
        return 'instruction';
    }

    protected function urlConfigKey(): string
    {
        return 'instruction_webhook_url';
    }

    protected function document(): ?Document
    {
        $this->instruction->loadMissing('document');

        return $this->instruction->document;
    }
}
