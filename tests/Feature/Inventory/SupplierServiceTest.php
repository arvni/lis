<?php

namespace Tests\Feature\Inventory;

use App\Domains\Inventory\Models\Supplier;
use App\Domains\Inventory\Repositories\SupplierRepository;
use App\Domains\Inventory\Services\SupplierService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Pagination\LengthAwarePaginator;
use Mockery;
use Tests\TestCase;

class SupplierServiceTest extends TestCase
{
    use RefreshDatabase;

    private SupplierRepository $repo;
    private SupplierService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->repo = Mockery::mock(SupplierRepository::class);
        $this->service = new SupplierService($this->repo);
    }

    public function test_list_delegates(): void
    {
        $paginator = new LengthAwarePaginator([], 0, 10);
        $this->repo->shouldReceive('listSuppliers')->once()->andReturn($paginator);
        $this->assertSame($paginator, $this->service->listSuppliers([]));
    }

    public function test_create_delegates(): void
    {
        $supplier = new Supplier();
        $this->repo->shouldReceive('createSupplier')->once()->with(['name' => 'Acme'])->andReturn($supplier);
        $this->assertSame($supplier, $this->service->createSupplier(['name' => 'Acme']));
    }

    public function test_update_delegates(): void
    {
        $supplier = new Supplier();
        $this->repo->shouldReceive('updateSupplier')->once()->with($supplier, ['name' => 'X'])->andReturn($supplier);
        $this->assertSame($supplier, $this->service->updateSupplier($supplier, ['name' => 'X']));
    }

    public function test_delete_delegates(): void
    {
        $supplier = new Supplier();
        $this->repo->shouldReceive('deleteSupplier')->once()->with($supplier)->andReturnNull();
        $this->service->deleteSupplier($supplier);
        $this->assertTrue(true);
    }

    public function test_get_supplier_by_id_loads_relations(): void
    {
        $supplier = Supplier::create(['name' => 'Real Supplier', 'code' => 'RS', 'is_active' => true]);
        $found = $this->service->getSupplierById($supplier->id);

        $this->assertSame($supplier->id, $found->id);
        $this->assertTrue($found->relationLoaded('contacts'));
    }
}
