<?php

declare(strict_types=1);

namespace App\Domains\Notification\Jobs;

use App\Domains\Document\Models\Document;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;

/**
 * Provider-app "entity updated" webhooks (instruction, consent form, request form,
 * sample type): multipart POST with the payload as a data.json part plus the
 * entity's document file when it has one.
 */
abstract class AbstractSendEntityUpdateWebhook extends AbstractSendWebhook
{
    public int $tries = 1;

    /** @var array<int, int> Wait times between retries */
    public array $backoff = [10];

    protected string $action;

    /**
     * The entity whose change is being broadcast.
     */
    abstract protected function entity(): Model;

    /**
     * Snake-case payload key, e.g. 'consent_form'.
     */
    abstract protected function entityKey(): string;

    /**
     * Key under the service config holding the webhook path, e.g. 'consent_form_webhook_url'.
     */
    abstract protected function urlConfigKey(): string;

    /**
     * The entity's attached document, if it has one. Implementations must load
     * the relation so it is also included in the entity's toArray() payload.
     */
    protected function document(): ?Document
    {
        return null;
    }

    /**
     * @return array<string, mixed>
     */
    protected function payload(): array
    {
        $this->document();
        $entity = $this->entity();
        $updatedAt = $entity->getAttribute('updated_at');

        return [
            $this->entityKey().'_id' => $entity->getKey(),
            'updated_at' => $updatedAt instanceof CarbonInterface ? $updatedAt->toISOString() : null,
            $this->entityKey() => $entity->toArray(),
            'action' => $this->action,
        ];
    }

    protected function webhookUrl(): string
    {
        return $this->joinUrl(
            (string) config($this->serviceConfig().'.webhook_domain'),
            (string) config($this->serviceConfig().'.'.$this->urlConfigKey()),
            $this->entity()->getKey()
        );
    }

    /**
     * @return array<string, mixed>
     */
    protected function logContext(): array
    {
        return [$this->entityKey().'_id' => $this->entity()->getKey()];
    }

    protected function send(string $webhookUrl, array $payload, string $signature): Response
    {
        $request = Http::timeout(30)->asMultipart();

        $document = $this->document();
        if ($document !== null) {
            $fileContents = file_get_contents(storage_path('app/private/'.$document->path));
            if ($fileContents !== false) {
                $request->attach('file', $fileContents, $document->originalName);
            }
        }

        $request->withHeaders(['X-Webhook-Signature' => $signature]);
        $request->attach('data', (string) json_encode($payload), 'data.json');

        return $request->post($webhookUrl);
    }
}
