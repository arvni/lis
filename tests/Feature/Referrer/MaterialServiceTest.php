<?php

namespace Tests\Feature\Referrer;

use App\Domains\Laboratory\Models\SampleType;
use App\Domains\Referrer\Adapters\LaboratoryAdapter;
use App\Domains\Referrer\DTOs\GroupMaterialDTO;
use App\Domains\Referrer\DTOs\MaterialDTO;
use App\Domains\Referrer\Models\Material;
use App\Domains\Referrer\Repositories\MaterialRepository;
use App\Domains\Referrer\Services\MaterialService;
use App\Domains\User\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Pagination\LengthAwarePaginator;
use Mockery;
use Tests\TestCase;

class MaterialServiceTest extends TestCase
{
    use RefreshDatabase;

    private MaterialRepository $repo;
    private MaterialService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->actingAs(User::factory()->create());
        $this->repo = Mockery::mock(MaterialRepository::class);
        // LaboratoryAdapter wraps the readonly SampleTypeService; resolve the real one.
        $this->service = new MaterialService($this->repo, app(LaboratoryAdapter::class));
    }

    public function test_list_materials_delegates(): void
    {
        $paginator = new LengthAwarePaginator([], 0, 10);
        $this->repo->shouldReceive('ListMaterials')->once()->andReturn($paginator);
        $this->assertSame($paginator, $this->service->listMaterials([]));
    }

    public function test_list_packing_series_materials_delegates(): void
    {
        $paginator = new LengthAwarePaginator([], 0, 10);
        $this->repo->shouldReceive('listPackingSeriesMaterials')->once()->andReturn($paginator);
        $this->assertSame($paginator, $this->service->listPackingSeriesMaterials([]));
    }

    public function test_store_material_creates_one_per_tube_and_returns_packing_series(): void
    {
        $sampleType = SampleType::create(['name' => 'Blood Plasma']);

        $dto = Mockery::mock(GroupMaterialDTO::class);
        $dto->sampleTypeId = $sampleType->id;
        $dto->tubes = [
            ['tube_barcode' => 'T1', 'expire_date' => '2027-01-01'],
            ['tube_barcode' => 'T2', 'expire_date' => '2027-01-01'],
        ];

        $created = [];
        $this->repo->shouldReceive('creatMaterial')->twice()->andReturnUsing(function ($data) use (&$created) {
            $created[] = $data;
            return new Material();
        });

        $packingSeries = $this->service->storeMaterial($dto);

        $this->assertCount(2, $created);
        // Prefix is the initials of the sample-type words: "Blood Plasma" → "BP".
        $this->assertStringStartsWith('BP-', $packingSeries);
        $this->assertSame($packingSeries, $created[0]['packing_series']);
    }

    public function test_update_material_unassigns_when_no_referrer(): void
    {
        $material = new Material();

        $dto = Mockery::mock(MaterialDTO::class);
        $dto->referrerId = null;
        $dto->shouldReceive('toArray')->andReturn(['barcode' => 'X']);

        $captured = null;
        $this->repo->shouldReceive('updateMaterial')->once()->andReturnUsing(function ($m, $data) use (&$captured, $material) {
            $captured = $data;
            return $material;
        });

        $this->service->updateMaterial($material, $dto);

        $this->assertNull($captured['order_material_id']);
        $this->assertNull($captured['assigned_at']);
    }

    public function test_delete_material_delegates(): void
    {
        $material = new Material();
        $this->repo->shouldReceive('deleteMaterial')->once()->with($material)->andReturnNull();
        $this->service->deleteMaterial($material);
        $this->assertTrue(true);
    }

    public function test_get_materials_by_packing_series_delegates(): void
    {
        $collection = new Collection();
        $this->repo->shouldReceive('getAll')->once()
            ->with(['filters' => ['packing_series' => 'BP-1']])
            ->andReturn($collection);
        $this->assertSame($collection, $this->service->getMaterialsByPackingSeries('BP-1'));
    }

    public function test_is_barcode_available_delegates(): void
    {
        $this->repo->shouldReceive('isBarcodeAvailableToAssign')->once()->with('B1', 7)->andReturn(true);
        $this->assertTrue($this->service->isBarcodeAvailableToAssign('B1', 7));
    }

    public function test_get_material_by_barcode_delegates(): void
    {
        $material = new Material();
        $this->repo->shouldReceive('getByBarcode')->once()->with('B1')->andReturn($material);
        $this->assertSame($material, $this->service->getMaterialByBarcode('B1'));
    }
}
