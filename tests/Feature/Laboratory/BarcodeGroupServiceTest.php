<?php

namespace Tests\Feature\Laboratory;

use App\Domains\Laboratory\DTOs\BarcodeGroupDTO;
use App\Domains\Laboratory\Models\BarcodeGroup;
use App\Domains\Laboratory\Repositories\BarcodeGroupRepository;
use App\Domains\Laboratory\Services\BarcodeGroupService;
use Exception;
use Mockery;
use Tests\TestCase;

class BarcodeGroupServiceTest extends TestCase
{
    private BarcodeGroupRepository $repo;
    private BarcodeGroupService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->repo = Mockery::mock(BarcodeGroupRepository::class);
        $this->service = new BarcodeGroupService($this->repo);
    }

    private function dto(array $data = ['name' => 'BG']): BarcodeGroupDTO
    {
        $dto = Mockery::mock(BarcodeGroupDTO::class);
        $dto->shouldReceive('toArray')->andReturn($data);
        return $dto;
    }

    private function groupWithMethods(bool $hasMethods): BarcodeGroup
    {
        $relation = Mockery::mock(\Illuminate\Database\Eloquent\Relations\HasMany::class);
        $relation->shouldReceive('exists')->andReturn($hasMethods);
        $group = Mockery::mock(BarcodeGroup::class)->makePartial();
        $group->shouldReceive('methods')->andReturn($relation);
        return $group;
    }

    public function test_list_delegates_to_repository(): void
    {
        $paginator = new \Illuminate\Pagination\LengthAwarePaginator([], 0, 10);
        $this->repo->shouldReceive('ListBarcodeGroups')->once()->with(['q' => 1])->andReturn($paginator);
        $this->assertSame($paginator, $this->service->listBarcodeGroups(['q' => 1]));
    }

    public function test_store_delegates_to_repository(): void
    {
        $bg = new BarcodeGroup();
        $this->repo->shouldReceive('creatBarcodeGroup')->once()->with(['name' => 'BG'])->andReturn($bg);
        $this->assertSame($bg, $this->service->storeBarcodeGroup($this->dto()));
    }

    public function test_update_delegates_to_repository(): void
    {
        $bg = new BarcodeGroup();
        $this->repo->shouldReceive('updateBarcodeGroup')->once()->with($bg, ['name' => 'BG'])->andReturn($bg);
        $this->assertSame($bg, $this->service->updateBarcodeGroup($bg, $this->dto()));
    }

    public function test_delete_removes_group_without_methods(): void
    {
        $group = $this->groupWithMethods(false);
        $this->repo->shouldReceive('deleteBarcodeGroup')->once()->with($group)->andReturnNull();
        $this->service->deleteBarcodeGroup($group);
        $this->assertTrue(true);
    }

    public function test_delete_throws_when_group_has_methods(): void
    {
        $group = $this->groupWithMethods(true);
        $this->repo->shouldNotReceive('deleteBarcodeGroup');
        $this->expectException(Exception::class);
        $this->service->deleteBarcodeGroup($group);
    }
}
