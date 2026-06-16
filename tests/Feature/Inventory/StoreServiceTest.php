<?php

namespace Tests\Feature\Inventory;

use App\Domains\Inventory\Models\Store;
use App\Domains\Inventory\Models\StoreLocation;
use App\Domains\Inventory\Repositories\StoreRepository;
use App\Domains\Inventory\Services\StoreService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Pagination\LengthAwarePaginator;
use Mockery;
use Tests\TestCase;

class StoreServiceTest extends TestCase
{
    use RefreshDatabase;

    private StoreRepository $repo;
    private StoreService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->repo = Mockery::mock(StoreRepository::class);
        $this->service = new StoreService($this->repo);
    }

    public function test_list_delegates(): void
    {
        $paginator = new LengthAwarePaginator([], 0, 10);
        $this->repo->shouldReceive('listStores')->once()->andReturn($paginator);
        $this->assertSame($paginator, $this->service->listStores([]));
    }

    public function test_create_delegates(): void
    {
        $store = new Store();
        $this->repo->shouldReceive('createStore')->once()->with(['name' => 'Main'])->andReturn($store);
        $this->assertSame($store, $this->service->createStore(['name' => 'Main']));
    }

    public function test_update_delegates(): void
    {
        $store = new Store();
        $this->repo->shouldReceive('updateStore')->once()->with($store, ['name' => 'X'])->andReturn($store);
        $this->assertSame($store, $this->service->updateStore($store, ['name' => 'X']));
    }

    public function test_delete_delegates(): void
    {
        $store = new Store();
        $this->repo->shouldReceive('deleteStore')->once()->with($store)->andReturnNull();
        $this->service->deleteStore($store);
        $this->assertTrue(true);
    }

    public function test_add_location_delegates(): void
    {
        $store = new Store();
        $location = new StoreLocation();
        $this->repo->shouldReceive('createLocation')->once()->with($store, ['code' => 'A1'])->andReturn($location);
        $this->assertSame($location, $this->service->addLocation($store, ['code' => 'A1']));
    }

    public function test_get_store_by_id_loads_relations(): void
    {
        $store = Store::create(['name' => 'Real', 'code' => 'RL', 'is_active' => true]);
        $found = $this->service->getStoreById($store->id);

        $this->assertSame($store->id, $found->id);
        $this->assertTrue($found->relationLoaded('locations'));
    }
}
