<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\Support;

use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * Posts to the provider panel the way the order webhooks do: HMAC-SHA256 over the exact body,
 * checked there by `verify.webhook:raw`.
 */
final class ProviderWebhook
{
    /** @param  array<string, mixed>  $payload */
    public static function post(string $configKey, string $defaultPath, array $payload): void
    {
        $domain = rtrim((string) config('services.provider_app.webhook_domain'), '/');
        $path = '/'.ltrim((string) config("services.provider_app.$configKey", $defaultPath), '/');
        $secret = (string) config('services.provider_app.webhook_secret');
        if ($secret === '') {
            throw new RuntimeException('PROVIDER_APP_WEBHOOK_SECRET is not set.');
        }

        $body = json_encode($payload, JSON_THROW_ON_ERROR);
        $response = Http::timeout(30)
            ->withHeaders(['X-Webhook-Signature' => hash_hmac('sha256', $body, $secret)])
            ->withBody($body, 'application/json')
            ->post($domain.$path);

        if (! $response->successful()) {
            throw new RuntimeException("Provider webhook $path failed with status {$response->status()}");
        }
    }
}
