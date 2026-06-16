<?php

namespace Tests\Feature\Monitoring;

use App\Domains\Monitoring\Services\MocreoService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use RuntimeException;
use Tests\TestCase;

class MocreoServiceTest extends TestCase
{
    use RefreshDatabase;

    private MocreoService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new MocreoService();
        // Prime a cached access token so token() short-circuits the OAuth flow.
        Cache::put('mocreo_access_token', 'fake-token', 3600);
    }

    public function test_get_nodes_returns_data_array(): void
    {
        Http::fake(['*/nodes' => Http::response(['data' => [['id' => 'N1'], ['id' => 'N2']]], 200)]);

        $nodes = $this->service->getNodes();

        $this->assertCount(2, $nodes);
        $this->assertSame('N1', $nodes[0]['id']);
    }

    public function test_get_nodes_throws_on_error_response(): void
    {
        Http::fake(['*/nodes' => Http::response(['message' => 'boom'], 500)]);

        $this->expectException(RuntimeException::class);
        $this->service->getNodes();
    }

    public function test_get_node_returns_data(): void
    {
        Http::fake(['*/nodes/N1' => Http::response(['data' => ['id' => 'N1', 'name' => 'Fridge']], 200)]);

        $node = $this->service->getNode('N1');

        $this->assertSame('Fridge', $node['name']);
    }

    public function test_get_samples_returns_records(): void
    {
        Http::fake(['*/nodes/N1/samples*' => Http::response(['data' => ['records' => [['t' => 4.5]]]], 200)]);

        $samples = $this->service->getSamples('N1', 10, 0);

        $this->assertCount(1, $samples);
        $this->assertSame(4.5, $samples[0]['t']);
    }

    public function test_authenticate_throws_without_credentials(): void
    {
        // No cached token and no Mocreo credentials in Settings → auth fails.
        Cache::forget('mocreo_access_token');
        Cache::forget('mocreo_refresh_token');

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('credentials not configured');
        $this->service->getNodes();
    }
}
