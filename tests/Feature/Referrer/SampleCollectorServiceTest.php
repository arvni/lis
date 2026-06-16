<?php

namespace Tests\Feature\Referrer;

use App\Domains\Referrer\DTOs\SampleCollectorDTO;
use App\Domains\Referrer\Models\SampleCollector;
use App\Domains\Referrer\Repositories\SampleCollectorRepository;
use App\Domains\Referrer\Services\SampleCollectorService;
use Exception;
use Illuminate\Pagination\LengthAwarePaginator;
use Mockery;
use Tests\TestCase;

class SampleCollectorServiceTest extends TestCase
{
    private SampleCollectorRepository $repo;
    private SampleCollectorService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->repo = Mockery::mock(SampleCollectorRepository::class);
        $this->service = new SampleCollectorService($this->repo);
    }

    private function dto(array $data = ['name' => 'Collector']): SampleCollectorDTO
    {
        $dto = Mockery::mock(SampleCollectorDTO::class);
        $dto->shouldReceive('toArray')->andReturn($data);
        return $dto;
    }

    private function collectorWith(bool $hasRequests): SampleCollector
    {
        $rel = Mockery::mock(\Illuminate\Database\Eloquent\Relations\HasMany::class);
        $rel->shouldReceive('exists')->andReturn($hasRequests);
        $collector = Mockery::mock(SampleCollector::class)->makePartial();
        $collector->shouldReceive('collectRequests')->andReturn($rel);
        return $collector;
    }

    public function test_list_delegates(): void
    {
        $paginator = new LengthAwarePaginator([], 0, 10);
        $this->repo->shouldReceive('listSampleCollector')->once()->andReturn($paginator);
        $this->assertSame($paginator, $this->service->listSampleCollectors([]));
    }

    public function test_create_delegates(): void
    {
        $collector = new SampleCollector();
        $this->repo->shouldReceive('createSampleCollector')->once()->with(['name' => 'Collector'])->andReturn($collector);
        $this->assertSame($collector, $this->service->createSampleCollector($this->dto()));
    }

    public function test_update_delegates(): void
    {
        $collector = new SampleCollector();
        $this->repo->shouldReceive('updateSampleCollector')->once()->with($collector, ['name' => 'Collector'])->andReturn($collector);
        $this->assertSame($collector, $this->service->updateSampleCollector($collector, $this->dto()));
    }

    public function test_get_by_email_delegates(): void
    {
        $collector = new SampleCollector();
        $this->repo->shouldReceive('findSampleCollectorByEmail')->once()->with('a@b.c')->andReturn($collector);
        $this->assertSame($collector, $this->service->getSampleCollectorByEmail('a@b.c'));
    }

    public function test_get_by_id_delegates(): void
    {
        $collector = new SampleCollector();
        $this->repo->shouldReceive('findSampleCollectorById')->once()->with(3)->andReturn($collector);
        $this->assertSame($collector, $this->service->getSampleCollectorById(3));
    }

    public function test_delete_removes_collector_without_requests(): void
    {
        $collector = $this->collectorWith(false);
        $this->repo->shouldReceive('deleteSampleCollector')->once()->with($collector)->andReturnNull();
        $this->service->deleteSampleCollector($collector);
        $this->assertTrue(true);
    }

    public function test_delete_throws_when_collector_has_requests(): void
    {
        $collector = $this->collectorWith(true);
        $this->repo->shouldNotReceive('deleteSampleCollector');
        $this->expectException(Exception::class);
        $this->service->deleteSampleCollector($collector);
    }
}
