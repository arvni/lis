<?php

namespace Tests\Feature\Laboratory;

use App\Domains\Laboratory\DTOs\WorkflowDTO;
use App\Domains\Laboratory\Models\Workflow;
use App\Domains\Laboratory\Repositories\WorkflowRepository;
use App\Domains\Laboratory\Services\WorkflowService;
use Exception;
use Illuminate\Pagination\LengthAwarePaginator;
use Mockery;
use Tests\TestCase;

class WorkflowServiceTest extends TestCase
{
    private WorkflowRepository $repo;
    private WorkflowService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->repo = Mockery::mock(WorkflowRepository::class);
        $this->service = new WorkflowService($this->repo);
    }

    private function dto(array $data = ['name' => 'WF']): WorkflowDTO
    {
        $dto = Mockery::mock(WorkflowDTO::class);
        $dto->shouldReceive('toArray')->andReturn($data);
        return $dto;
    }

    private function workflowWithMethods(bool $has): Workflow
    {
        $relation = Mockery::mock();
        $relation->shouldReceive('exists')->andReturn($has);
        $workflow = Mockery::mock(Workflow::class)->makePartial();
        $workflow->shouldReceive('methods')->andReturn($relation);
        return $workflow;
    }

    public function test_list_delegates(): void
    {
        $paginator = new LengthAwarePaginator([], 0, 10);
        $this->repo->shouldReceive('ListWorkflows')->once()->andReturn($paginator);
        $this->assertSame($paginator, $this->service->listWorkflows([]));
    }

    public function test_store_delegates(): void
    {
        $wf = new Workflow();
        $this->repo->shouldReceive('creatWorkflow')->once()->with(['name' => 'WF'])->andReturn($wf);
        $this->assertSame($wf, $this->service->storeWorkflow($this->dto()));
    }

    public function test_update_delegates(): void
    {
        $wf = new Workflow();
        $this->repo->shouldReceive('updateWorkflow')->once()->with($wf, ['name' => 'WF'])->andReturn($wf);
        $this->assertSame($wf, $this->service->updateWorkflow($wf, $this->dto()));
    }

    public function test_delete_removes_workflow_without_methods(): void
    {
        $wf = $this->workflowWithMethods(false);
        $this->repo->shouldReceive('deleteWorkflow')->once()->with($wf)->andReturnNull();
        $this->service->deleteWorkflow($wf);
        $this->assertTrue(true);
    }

    public function test_delete_throws_when_workflow_has_methods(): void
    {
        $wf = $this->workflowWithMethods(true);
        $this->repo->shouldNotReceive('deleteWorkflow');
        $this->expectException(Exception::class);
        $this->service->deleteWorkflow($wf);
    }

    public function test_sync_section_workflows_deletes_unlisted(): void
    {
        $relation = Mockery::mock();
        $relation->shouldReceive('whereNotIn')->once()->with('section_workflows.id', [1, 2])->andReturnSelf();
        $relation->shouldReceive('delete')->once()->andReturn(1);

        $wf = Mockery::mock(Workflow::class)->makePartial();
        $wf->shouldReceive('sectionWorkflows')->once()->andReturn($relation);

        $this->service->syncSectionWorkflows($wf, [1, 2]);
        $this->assertTrue(true);
    }

    public function test_get_prev_sections_filters_by_order(): void
    {
        $relation = Mockery::mock();
        $relation->shouldReceive('wherePivot')->once()->with('order', '<', 3)->andReturnSelf();
        $relation->shouldReceive('get')->once()->andReturn('PREV');

        $wf = Mockery::mock(Workflow::class)->makePartial();
        $wf->shouldReceive('sections')->once()->andReturn($relation);

        $this->assertSame('PREV', $this->service->getPrevSections($wf, 3));
    }
}
