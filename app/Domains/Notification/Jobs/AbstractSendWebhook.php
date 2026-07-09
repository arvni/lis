<?php

declare(strict_types=1);

namespace App\Domains\Notification\Jobs;

use Exception;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Http\Client\Response;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

abstract class AbstractSendWebhook implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    /** @var array<int, int> Wait times between retries */
    public array $backoff = [10, 30, 60];

    /**
     * Build the webhook payload. Return null to skip sending entirely
     * (e.g. the subject entity no longer exists).
     *
     * @return array<string, mixed>|null
     */
    abstract protected function payload(): ?array;

    /**
     * Full URL the webhook is posted to.
     */
    abstract protected function webhookUrl(): string;

    /**
     * Context identifying the subject entity, merged into every log entry.
     *
     * @return array<string, mixed>
     */
    abstract protected function logContext(): array;

    /**
     * Config prefix of the receiving service (holds webhook_domain/webhook_secret).
     */
    protected function serviceConfig(): string
    {
        return 'services.provider_app';
    }

    /**
     * Extra request headers beyond the HMAC signature.
     *
     * @return array<string, string>
     */
    protected function headers(): array
    {
        return [];
    }

    public function handle(): void
    {
        $payload = $this->payload();

        if ($payload === null) {
            return;
        }

        $webhookUrl = $this->webhookUrl();
        $signature = hash_hmac(
            'sha256',
            (string) json_encode($payload),
            (string) config($this->serviceConfig().'.webhook_secret')
        );

        Log::debug(class_basename(static::class).' URL: '.$webhookUrl);

        try {
            $response = $this->send($webhookUrl, $payload, $signature);

            if (! $response->successful()) {
                throw new Exception('Webhook failed with status: '.$response->status());
            }

            Log::info(class_basename(static::class).' sent successfully', $this->logContext());
        } catch (Exception $e) {
            Log::error(class_basename(static::class).' failed', [
                ...$this->logContext(),
                'error' => $e->getMessage(),
                'webhook_url' => $webhookUrl,
            ]);

            throw $e; // rethrow so the queue retries per $tries/$backoff
        }
    }

    /**
     * Post the signed payload. Default is a JSON POST; override for multipart.
     *
     * @param  array<string, mixed>  $payload
     */
    protected function send(string $webhookUrl, array $payload, string $signature): Response
    {
        return Http::timeout(30)
            ->withHeaders(['X-Webhook-Signature' => $signature, ...$this->headers()])
            ->post($webhookUrl, $payload);
    }

    /**
     * Join a webhook domain, path and optional entity suffix into one URL.
     */
    protected function joinUrl(string $domain, string $path, string|int|null $suffix = null): string
    {
        $url = rtrim($domain, '/').'/'.ltrim($path, '/');

        if ($suffix !== null) {
            $url = rtrim($url, '/').'/'.$suffix;
        }

        return $url;
    }
}
