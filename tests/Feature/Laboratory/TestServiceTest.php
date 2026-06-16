<?php

namespace Tests\Feature\Laboratory;

use App\Domains\Laboratory\DTOs\TestDTO;
use App\Domains\Laboratory\Enums\TestType;
use App\Domains\Laboratory\Models\Test;
use App\Domains\Laboratory\Repositories\TestRepository;
use App\Domains\Laboratory\Services\MethodService;
use App\Domains\Laboratory\Services\MethodTestService;
use App\Domains\Laboratory\Services\TestService;
use App\Domains\User\Models\User;
use Exception;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Pagination\LengthAwarePaginator;
use Mockery;
use Tests\TestCase;

class TestServiceTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->actingAs(User::factory()->create());
    }

    private function serviceWithMockedRepo(TestRepository $repo): TestService
    {
        return new TestService($repo, app(MethodService::class), app(MethodTestService::class));
    }

    public function test_list_tests_delegates(): void
    {
        $repo = Mockery::mock(TestRepository::class);
        $paginator = new LengthAwarePaginator([], 0, 10);
        $repo->shouldReceive('ListTests')->once()->andReturn($paginator);
        $this->assertSame($paginator, $this->serviceWithMockedRepo($repo)->listTests([]));
    }

    public function test_all_tests_delegates(): void
    {
        $repo = Mockery::mock(TestRepository::class);
        $collection = new Collection();
        $repo->shouldReceive('allTests')->once()->andReturn($collection);
        $this->assertSame($collection, $this->serviceWithMockedRepo($repo)->allTests([]));
    }

    public function test_store_test_creates_test_with_method_and_method_test(): void
    {
        $service = app(TestService::class);

        $dto = Mockery::mock(TestDTO::class);
        $dto->shouldReceive('toArray')->andReturn([
            'name'      => 'Glucose',
            'fullName'  => 'Glucose Test',
            'code'      => 'GLU' . uniqid(),
            'type'      => TestType::TEST,
            'status'    => true,
            'can_merge' => false,
        ]);
        $dto->report_templates = [];

        $validatedData = [
            'method_tests' => [[
                'status' => true,
                'method' => [
                    'name'                => 'Standard Method',
                    'price_type'          => 'Fix',
                    'price'               => 10,
                    'referrer_price_type' => 'Fix',
                    'referrer_price'      => 8,
                    'turnaround_time'     => 2,
                    'no_patient'          => 1,
                    'no_sample'           => 1,
                ],
            ]],
            'sample_type_tests' => [],
            'test_groups'       => [],
        ];

        $test = $service->storeTest($dto, $validatedData);

        $this->assertDatabaseHas('tests', ['name' => 'Glucose']);
        $this->assertDatabaseHas('methods', ['name' => 'Standard Method']);
        $this->assertDatabaseHas('method_tests', ['test_id' => $test->id]);
    }

    public function test_delete_test_deletes_methods_when_unused(): void
    {
        $repo = Mockery::mock(TestRepository::class);

        $methodsRel = Mockery::mock(BelongsToMany::class);
        $methodsRel->shouldReceive('withCount')->andReturnSelf();
        $methodsRel->shouldReceive('having')->andReturnSelf();
        $methodsRel->shouldReceive('exists')->andReturn(false);
        $methodsRel->shouldReceive('delete')->once()->andReturn(1);

        $test = Mockery::mock(Test::class)->makePartial();
        $test->type = TestType::TEST;
        $test->shouldReceive('methods')->andReturn($methodsRel);

        $repo->shouldReceive('deleteTest')->once()->with($test)->andReturnNull();

        $this->serviceWithMockedRepo($repo)->deleteTest($test);
        $this->assertTrue(true);
    }

    public function test_delete_test_throws_when_methods_in_use(): void
    {
        $repo = Mockery::mock(TestRepository::class);

        $methodsRel = Mockery::mock(BelongsToMany::class);
        $methodsRel->shouldReceive('withCount')->andReturnSelf();
        $methodsRel->shouldReceive('having')->andReturnSelf();
        $methodsRel->shouldReceive('exists')->andReturn(true);

        $test = Mockery::mock(Test::class)->makePartial();
        $test->type = TestType::TEST;
        $test->shouldReceive('methods')->andReturn($methodsRel);

        $repo->shouldNotReceive('deleteTest');

        $this->expectException(Exception::class);
        $this->serviceWithMockedRepo($repo)->deleteTest($test);
    }

    public function test_sync_methods_panel_syncs_pivot(): void
    {
        $repo = Mockery::mock(TestRepository::class);
        $methodsRel = Mockery::mock(BelongsToMany::class);
        $methodsRel->shouldReceive('sync')->once()->with([1, 2])->andReturn([]);

        $test = Mockery::mock(Test::class)->makePartial();
        $test->type = TestType::PANEL;
        $test->shouldReceive('methods')->andReturn($methodsRel);

        $this->serviceWithMockedRepo($repo)->syncMethods($test, [1, 2]);
        $this->assertTrue(true);
    }

    public function test_sync_methods_non_panel_disables_unlisted_method_tests(): void
    {
        $repo = Mockery::mock(TestRepository::class);

        $methodsRel = Mockery::mock(BelongsToMany::class);
        $methodsRel->shouldReceive('whereIn')->andReturnSelf();
        $methodsRel->shouldReceive('count')->andReturn(0); // count mismatch → triggers disabling

        $mtRel = Mockery::mock();
        $mtRel->shouldReceive('whereNotIn')->once()->with('method_id', [3])->andReturnSelf();
        $mtRel->shouldReceive('update')->once()->with(['status' => false])->andReturn(1);

        $test = Mockery::mock(Test::class)->makePartial();
        $test->type = TestType::TEST;
        $test->shouldReceive('methods')->andReturn($methodsRel);
        $test->shouldReceive('MethodTests')->andReturn($mtRel);

        $this->serviceWithMockedRepo($repo)->syncMethods($test, [3]);
        $this->assertTrue(true);
    }

    public function test_load_test_loads_relations(): void
    {
        $repo = Mockery::mock(TestRepository::class);
        $test = Mockery::mock(Test::class)->makePartial();
        $test->shouldReceive('load')->once()->with(Mockery::type('array'))->andReturnSelf();

        $result = $this->serviceWithMockedRepo($repo)->loadTest($test);
        $this->assertSame($test, $result);
    }
}
