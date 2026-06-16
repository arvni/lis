<?php

namespace Tests\Feature\Laboratory;

use App\Domains\Laboratory\DTOs\MethodTestDTO;
use App\Domains\Laboratory\Models\MethodTest;
use App\Domains\Laboratory\Repositories\MethodTestRepository;
use App\Domains\Laboratory\Services\MethodTestService;
use Mockery;
use Tests\TestCase;

class MethodTestServiceTest extends TestCase
{
    private MethodTestRepository $repo;
    private MethodTestService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->repo = Mockery::mock(MethodTestRepository::class);
        $this->service = new MethodTestService($this->repo);
    }

    private function dto(array $data = ['method_id' => 1]): MethodTestDTO
    {
        $dto = Mockery::mock(MethodTestDTO::class);
        $dto->shouldReceive('toArray')->andReturn($data);
        return $dto;
    }

    public function test_store_delegates_to_repository(): void
    {
        $mt = new MethodTest();
        $this->repo->shouldReceive('createMethodTest')->once()->with(['method_id' => 1])->andReturn($mt);
        $this->assertSame($mt, $this->service->storeMethodTest($this->dto()));
    }

    public function test_update_delegates_to_repository(): void
    {
        $mt = new MethodTest();
        $this->repo->shouldReceive('updateMethodTest')->once()->with($mt, ['method_id' => 1])->andReturn($mt);
        $this->assertSame($mt, $this->service->updateMethodTest($mt, $this->dto()));
    }

    public function test_find_by_id_delegates_to_repository(): void
    {
        $mt = new MethodTest();
        $this->repo->shouldReceive('findMethodTestById')->once()->with(4)->andReturn($mt);
        $this->assertSame($mt, $this->service->findMethodTestById(4));
    }

    public function test_delete_delegates_to_repository(): void
    {
        $mt = new MethodTest();
        $this->repo->shouldReceive('deleteMethodTest')->once()->with($mt)->andReturnNull();
        $this->service->deleteMethodTest($mt);
        $this->assertTrue(true);
    }
}
