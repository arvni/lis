<?php

namespace Tests\Feature\Laboratory;

use App\Domains\Laboratory\DTOs\SampleTypeDTO;
use App\Domains\Laboratory\Models\SampleType;
use App\Domains\Laboratory\Repositories\SampleTypeRepository;
use App\Domains\Laboratory\Services\SampleTypeService;
use Exception;
use Illuminate\Pagination\LengthAwarePaginator;
use Mockery;
use Tests\TestCase;

class SampleTypeServiceTest extends TestCase
{
    private SampleTypeRepository $repo;
    private SampleTypeService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->repo = Mockery::mock(SampleTypeRepository::class);
        $this->service = new SampleTypeService($this->repo);
    }

    private function dto(array $data = ['name' => 'Blood']): SampleTypeDTO
    {
        $dto = Mockery::mock(SampleTypeDTO::class);
        $dto->shouldReceive('toArray')->andReturn($data);
        return $dto;
    }

    private function typeWithSamples(bool $has): SampleType
    {
        $relation = Mockery::mock(\Illuminate\Database\Eloquent\Relations\HasMany::class);
        $relation->shouldReceive('exists')->andReturn($has);
        $type = Mockery::mock(SampleType::class)->makePartial();
        $type->shouldReceive('samples')->andReturn($relation);
        return $type;
    }

    public function test_list_delegates(): void
    {
        $paginator = new LengthAwarePaginator([], 0, 10);
        $this->repo->shouldReceive('ListSampleTypes')->once()->andReturn($paginator);
        $this->assertSame($paginator, $this->service->listSampleTypes([]));
    }

    public function test_store_delegates(): void
    {
        $type = new SampleType();
        $this->repo->shouldReceive('creatSampleType')->once()->with(['name' => 'Blood'])->andReturn($type);
        $this->assertSame($type, $this->service->storeSampleType($this->dto()));
    }

    public function test_update_delegates(): void
    {
        $type = new SampleType();
        $this->repo->shouldReceive('updateSampleType')->once()->with($type, ['name' => 'Blood'])->andReturn($type);
        $this->assertSame($type, $this->service->updateSampleType($type, $this->dto()));
    }

    public function test_get_by_id_delegates(): void
    {
        $type = new SampleType();
        $this->repo->shouldReceive('getSampleTypeById')->once()->with(5)->andReturn($type);
        $this->assertSame($type, $this->service->getSampleTypeById(5));
    }

    public function test_delete_removes_type_without_samples(): void
    {
        $type = $this->typeWithSamples(false);
        $this->repo->shouldReceive('deleteSampleType')->once()->with($type)->andReturnNull();
        $this->service->deleteSampleType($type);
        $this->assertTrue(true);
    }

    public function test_delete_throws_when_type_has_samples(): void
    {
        $type = $this->typeWithSamples(true);
        $this->repo->shouldNotReceive('deleteSampleType');
        $this->expectException(Exception::class);
        $this->service->deleteSampleType($type);
    }
}
