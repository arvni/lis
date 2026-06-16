<?php

namespace Tests\Feature\Inventory;

use App\Domains\Inventory\Models\Unit;
use App\Domains\Inventory\Repositories\UnitRepository;
use App\Domains\Inventory\Services\UnitService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Pagination\LengthAwarePaginator;
use Mockery;
use Tests\TestCase;

class UnitServiceTest extends TestCase
{
    use RefreshDatabase;

    private UnitRepository $repo;
    private UnitService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->repo = Mockery::mock(UnitRepository::class);
        $this->service = new UnitService($this->repo);
    }

    public function test_list_delegates(): void
    {
        $paginator = new LengthAwarePaginator([], 0, 10);
        $this->repo->shouldReceive('listUnits')->once()->with(['x' => 1])->andReturn($paginator);
        $this->assertSame($paginator, $this->service->listUnits(['x' => 1]));
    }

    public function test_create_delegates(): void
    {
        $unit = new Unit();
        $this->repo->shouldReceive('createUnit')->once()->with(['name' => 'Box'])->andReturn($unit);
        $this->assertSame($unit, $this->service->createUnit(['name' => 'Box']));
    }

    public function test_update_delegates(): void
    {
        $unit = new Unit();
        $this->repo->shouldReceive('updateUnit')->once()->with($unit, ['name' => 'X'])->andReturn($unit);
        $this->assertSame($unit, $this->service->updateUnit($unit, ['name' => 'X']));
    }

    public function test_delete_delegates(): void
    {
        $unit = new Unit();
        $this->repo->shouldReceive('deleteUnit')->once()->with($unit)->andReturnNull();
        $this->service->deleteUnit($unit);
        $this->assertTrue(true);
    }

    public function test_all_units_returns_alphabetical_collection(): void
    {
        Unit::create(['name' => 'Zeta', 'abbreviation' => 'z']);
        Unit::create(['name' => 'Alpha', 'abbreviation' => 'a']);

        $this->assertSame(['Alpha', 'Zeta'], $this->service->allUnits()->pluck('name')->all());
    }
}
