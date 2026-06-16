<?php

namespace Tests\Feature\Laboratory;

use App\Domains\Laboratory\DTOs\MethodDTO;
use App\Domains\Laboratory\Models\Method;
use App\Domains\Laboratory\Repositories\MethodRepository;
use App\Domains\Laboratory\Services\MethodService;
use Mockery;
use Tests\TestCase;

class MethodServiceTest extends TestCase
{
    private MethodRepository $repo;
    private MethodService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->repo = Mockery::mock(MethodRepository::class);
        $this->service = new MethodService($this->repo);
    }

    private function dto(array $data = ['name' => 'M']): MethodDTO
    {
        $dto = Mockery::mock(MethodDTO::class);
        $dto->shouldReceive('toArray')->andReturn($data);
        return $dto;
    }

    public function test_store_method_delegates_to_repository(): void
    {
        $method = new Method();
        $this->repo->shouldReceive('creatMethod')->once()->with(['name' => 'M'])->andReturn($method);
        $this->assertSame($method, $this->service->storeMethod($this->dto()));
    }

    public function test_update_method_delegates_to_repository(): void
    {
        $method = new Method();
        $this->repo->shouldReceive('updateMethod')->once()->with($method, ['name' => 'M'])->andReturn($method);
        $this->assertSame($method, $this->service->updateMethod($method, $this->dto()));
    }

    public function test_find_method_by_id_delegates_to_repository(): void
    {
        $method = new Method();
        $this->repo->shouldReceive('findMethodById')->once()->with(3)->andReturn($method);
        $this->assertSame($method, $this->service->findMethodById(3));
    }

    public function test_delete_method_delegates_to_repository(): void
    {
        $method = new Method();
        $this->repo->shouldReceive('deleteMethod')->once()->with($method)->andReturnNull();
        $this->service->deleteMethod($method);
        $this->assertTrue(true);
    }
}
