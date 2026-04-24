<?php

namespace App\Domains\Monitoring\Services;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class MocreoService
{
    private const BASE_URL    = 'https://api.sync-sign.com/v2';
    private const ACCESS_KEY  = 'mocreo_access_token';
    private const REFRESH_KEY = 'mocreo_refresh_token';

    private function token(): string
    {
        if (Cache::has(self::ACCESS_KEY)) {
            return Cache::get(self::ACCESS_KEY);
        }
        if (Cache::has(self::REFRESH_KEY)) {
            try {
                return $this->doRefresh(Cache::get(self::REFRESH_KEY));
            } catch (\Throwable) {}
        }
        return $this->doAuthenticate();
    }

    private function doAuthenticate(): string
    {
        $username = config('services.mocreo.username');
        $password = config('services.mocreo.password');

        if (!$username || !$password) {
            throw new \RuntimeException('Mocreo credentials not configured. Set MOCREO_USERNAME and MOCREO_PASSWORD in .env');
        }

        $res = Http::post(self::BASE_URL . '/oauth/token', [
            'username' => $username,
            'password' => $password,
            'provider' => 'mocreo',
        ]);

        if (!$res->successful()) {
            $msg = $res->json('message') ?? $res->body();
            throw new \RuntimeException("Mocreo authentication failed (HTTP {$res->status()}): {$msg}");
        }

        return $this->storeTokens($res->json('data') ?? []);
    }

    private function doRefresh(string $refreshToken): string
    {
        $res = Http::post(self::BASE_URL . '/oauth/token/refresh', [
            'refreshToken' => $refreshToken,
            'provider'     => 'mocreo',
        ]);

        if (!$res->successful()) {
            throw new \RuntimeException("Mocreo token refresh failed (HTTP {$res->status()})");
        }

        return $this->storeTokens($res->json('data') ?? []);
    }

    private function storeTokens(array $data): string
    {
        if (empty($data['accessToken'])) {
            throw new \RuntimeException(
                'Mocreo auth response missing accessToken. Keys received: ' . implode(', ', array_keys($data))
            );
        }

        $now = now()->timestamp;
        // expiresAt values are Unix timestamps in milliseconds — convert to seconds
        $accessTtl  = max((int) (($data['accessTokenExpiresAt']  ?? (($now + 3600)  * 1000)) / 1000) - $now - 60, 60);
        $refreshTtl = max((int) (($data['refreshTokenExpiresAt'] ?? (($now + 2592000) * 1000)) / 1000) - $now - 60, 0);

        Cache::put(self::ACCESS_KEY, $data['accessToken'], $accessTtl);
        if ($refreshTtl > 0) {
            Cache::put(self::REFRESH_KEY, $data['refreshToken'] ?? '', $refreshTtl);
        }
        return $data['accessToken'];
    }

    private function http(): PendingRequest
    {
        return Http::withToken($this->token())->baseUrl(self::BASE_URL);
    }

    public function getNodes(): array
    {
        $res = $this->http()->get('/nodes');
        if (!$res->successful()) {
            throw new \RuntimeException("Failed to fetch nodes (HTTP {$res->status()})");
        }
        return $res->json('data') ?? [];
    }

    public function getNode(string $nodeId): array
    {
        $res = $this->http()->get("/nodes/{$nodeId}");
        if (!$res->successful()) {
            throw new \RuntimeException("Failed to fetch node {$nodeId} (HTTP {$res->status()})");
        }
        return $res->json('data') ?? [];
    }

    public function getSamples(
        string $nodeId,
        int    $limit     = 50,
        int    $offset    = 0,
        ?int   $beginTime = null,
        ?int   $endTime   = null
    ): array {
        $params = ['limit' => $limit, 'offset' => $offset];
        if ($beginTime !== null) $params['beginTime'] = $beginTime;
        if ($endTime   !== null) $params['endTime']   = $endTime;

        $res = $this->http()->get("/nodes/{$nodeId}/samples", $params);
        if (!$res->successful()) {
            throw new \RuntimeException("Failed to fetch samples for node {$nodeId} (HTTP {$res->status()})");
        }
        return $res->json('data.records') ?? [];
    }
}
