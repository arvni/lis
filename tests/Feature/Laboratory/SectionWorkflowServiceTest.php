<?php

namespace Tests\Feature\Laboratory;

use App\Domains\Laboratory\DTOs\SectionWorkflowDTO;
use App\Domains\Laboratory\Models\SectionWorkflow;
use App\Domains\Laboratory\Repositories\SectionWorkflowRepository;
use App\Domains\Laboratory\Services\SectionWorkflowService;
use Mockery;
use Tests\TestCase;

class SectionWorkflowServiceTest extends TestCase
{
    private SectionWorkflowRepository $repo;
    private SectionWorkflowService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->repo = Mockery::mock(SectionWorkflowRepository::class);
        $this->service = new SectionWorkflowService($this->repo);
    }

    private function dto(array $data = ['name' => 'W']): SectionWorkflowDTO
    {
        $dto = Mockery::mock(SectionWorkflowDTO::class);
        $dto->shouldReceive('toArray')->andReturn($data);
        return $dto;
    }

    public function test_store_delegates_to_repository(): void
    {
        $sw = new SectionWorkflow();
        $this->repo->shouldReceive('creatSectionWorkflow')->once()->with(['name' => 'W'])->andReturn($sw);
        $this->assertSame($sw, $this->service->storeSectionWorkflow($this->dto()));
    }

    public function test_update_delegates_to_repository(): void
    {
        $sw = new SectionWorkflow();
        $this->repo->shouldReceive('updateSectionWorkflow')->once()->with($sw, ['name' => 'W'])->andReturn($sw);
        $this->assertSame($sw, $this->service->updateSectionWorkflow($sw, $this->dto()));
    }

    public function test_find_by_id_delegates_to_repository(): void
    {
        $sw = new SectionWorkflow();
        $this->repo->shouldReceive('findSectionWorkflowById')->once()->with(2)->andReturn($sw);
        $this->assertSame($sw, $this->service->findSectionWorkflowById(2));
    }

    public function test_delete_delegates_to_repository(): void
    {
        $sw = new SectionWorkflow();
        $this->repo->shouldReceive('deleteSectionWorkflow')->once()->with($sw)->andReturnNull();
        $this->service->deleteSectionWorkflow($sw);
        $this->assertTrue(true);
    }
}
