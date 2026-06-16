<?php

namespace Tests\Feature\Laboratory;

use App\Domains\Laboratory\DTOs\TestGroupDTO;
use App\Domains\Laboratory\Models\TestGroup;
use App\Domains\Laboratory\Repositories\TestGroupRepository;
use App\Domains\Laboratory\Services\TestGroupService;
use Exception;
use Mockery;
use Tests\TestCase;

class TestGroupServiceTest extends TestCase
{
    private TestGroupRepository $repo;
    private TestGroupService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->repo = Mockery::mock(TestGroupRepository::class);
        $this->service = new TestGroupService($this->repo);
    }

    private function dto(array $data = ['name' => 'TG']): TestGroupDTO
    {
        $dto = Mockery::mock(TestGroupDTO::class);
        $dto->shouldReceive('toArray')->andReturn($data);
        return $dto;
    }

    private function groupWithTests(bool $hasTests): TestGroup
    {
        $relation = Mockery::mock();
        $relation->shouldReceive('exists')->andReturn($hasTests);
        $group = Mockery::mock(TestGroup::class)->makePartial();
        $group->shouldReceive('tests')->andReturn($relation);
        return $group;
    }

    public function test_list_delegates_to_repository(): void
    {
        $paginator = new \Illuminate\Pagination\LengthAwarePaginator([], 0, 10);
        $this->repo->shouldReceive('ListTestGroups')->once()->with([])->andReturn($paginator);
        $this->assertSame($paginator, $this->service->listTestGroups([]));
    }

    public function test_store_delegates_to_repository(): void
    {
        $tg = new TestGroup();
        $this->repo->shouldReceive('creatTestGroup')->once()->with(['name' => 'TG'])->andReturn($tg);
        $this->assertSame($tg, $this->service->storeTestGroup($this->dto()));
    }

    public function test_update_delegates_to_repository(): void
    {
        $tg = new TestGroup();
        $this->repo->shouldReceive('updateTestGroup')->once()->with($tg, ['name' => 'TG'])->andReturn($tg);
        $this->assertSame($tg, $this->service->updateTestGroup($tg, $this->dto()));
    }

    public function test_delete_removes_group_without_tests(): void
    {
        $group = $this->groupWithTests(false);
        $this->repo->shouldReceive('deleteTestGroup')->once()->with($group)->andReturnNull();
        $this->service->deleteTestGroup($group);
        $this->assertTrue(true);
    }

    public function test_delete_throws_when_group_has_tests(): void
    {
        $group = $this->groupWithTests(true);
        $this->repo->shouldNotReceive('deleteTestGroup');
        $this->expectException(Exception::class);
        $this->service->deleteTestGroup($group);
    }
}
