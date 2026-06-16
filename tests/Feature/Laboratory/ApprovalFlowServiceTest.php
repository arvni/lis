<?php

namespace Tests\Feature\Laboratory;

use App\Domains\Laboratory\Models\ApprovalFlow;
use App\Domains\Laboratory\Repositories\ApprovalFlowRepository;
use App\Domains\Laboratory\Services\ApprovalFlowService;
use App\Domains\User\Models\User;
use Exception;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Pagination\LengthAwarePaginator;
use Mockery;
use Tests\TestCase;

class ApprovalFlowServiceTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->actingAs(User::factory()->create());
    }

    public function test_list_delegates_to_repository(): void
    {
        $repo = Mockery::mock(ApprovalFlowRepository::class);
        $paginator = new LengthAwarePaginator([], 0, 10);
        $repo->shouldReceive('listApprovalFlows')->once()->andReturn($paginator);

        $service = new ApprovalFlowService($repo);
        $this->assertSame($paginator, $service->listApprovalFlows([]));
    }

    public function test_store_creates_flow_with_steps(): void
    {
        $service = app(ApprovalFlowService::class);

        $flow = $service->storeApprovalFlow([
            'name'  => 'QC Flow',
            'steps' => [
                ['name' => 'First review'],
                ['name' => 'Final sign-off'],
            ],
        ]);

        $this->assertDatabaseHas('approval_flows', ['name' => 'QC Flow']);
        $this->assertCount(2, $flow->steps()->get());
        $this->assertSame([1, 2], $flow->steps()->pluck('position')->all());
    }

    public function test_update_resyncs_steps_keeping_matched_ids(): void
    {
        $service = app(ApprovalFlowService::class);
        $flow = $service->storeApprovalFlow([
            'name'  => 'Flow',
            'steps' => [['name' => 'Step A'], ['name' => 'Step B']],
        ]);

        $stepA = $flow->steps()->where('name', 'Step A')->first();

        $service->updateApprovalFlow($flow, [
            'name'  => 'Flow',
            'steps' => [
                ['id' => $stepA->id, 'name' => 'Step A renamed'],
                ['name' => 'Step C'],
            ],
        ]);

        $steps = $flow->fresh()->steps()->get();
        $this->assertCount(2, $steps);
        // The kept row retains its id (so report approvals still point at it).
        $this->assertTrue($steps->contains('id', $stepA->id));
        $this->assertSame('Step A renamed', $steps->firstWhere('id', $stepA->id)->name);
        // The previously-existing "Step B" was removed.
        $this->assertFalse($steps->contains('name', 'Step B'));
    }

    public function test_delete_removes_flow_without_report_templates(): void
    {
        $repo = Mockery::mock(ApprovalFlowRepository::class);
        $relation = Mockery::mock(HasMany::class);
        $relation->shouldReceive('exists')->andReturn(false);
        $flow = Mockery::mock(ApprovalFlow::class)->makePartial();
        $flow->shouldReceive('reportTemplates')->andReturn($relation);

        $repo->shouldReceive('deleteApprovalFlow')->once()->with($flow)->andReturnNull();

        $service = new ApprovalFlowService($repo);
        $service->deleteApprovalFlow($flow);
        $this->assertTrue(true);
    }

    public function test_delete_throws_when_report_templates_exist(): void
    {
        $repo = Mockery::mock(ApprovalFlowRepository::class);
        $relation = Mockery::mock(HasMany::class);
        $relation->shouldReceive('exists')->andReturn(true);
        $flow = Mockery::mock(ApprovalFlow::class)->makePartial();
        $flow->shouldReceive('reportTemplates')->andReturn($relation);

        $repo->shouldNotReceive('deleteApprovalFlow');

        $service = new ApprovalFlowService($repo);
        $this->expectException(Exception::class);
        $service->deleteApprovalFlow($flow);
    }
}
