<?php

namespace Tests\Feature\Referrer;

use App\Domains\Referrer\DTOs\OrderMaterialDTO;
use App\Domains\Referrer\Events\OrderMaterialCreated;
use App\Domains\Referrer\Models\OrderMaterial;
use App\Domains\Referrer\Repositories\MaterialRepository;
use App\Domains\Referrer\Repositories\OrderMaterialRepository;
use App\Domains\Referrer\Services\OrderMaterialService;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Event;
use Mockery;
use Tests\TestCase;

class OrderMaterialServiceTest extends TestCase
{
    private OrderMaterialRepository $orderRepo;
    private MaterialRepository $materialRepo;
    private OrderMaterialService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->orderRepo = Mockery::mock(OrderMaterialRepository::class);
        $this->materialRepo = Mockery::mock(MaterialRepository::class);
        $this->service = new OrderMaterialService($this->orderRepo, $this->materialRepo);
    }

    private function dto(array $materials = []): OrderMaterialDTO
    {
        $dto = Mockery::mock(OrderMaterialDTO::class);
        $dto->shouldReceive('toArray')->andReturn(['referrer_id' => 1, 'materials' => $materials]);
        $dto->materials = $materials;
        return $dto;
    }

    public function test_list_delegates(): void
    {
        $paginator = new LengthAwarePaginator([], 0, 10);
        $this->orderRepo->shouldReceive('ListOrderMaterials')->once()->andReturn($paginator);
        $this->assertSame($paginator, $this->service->listOrderMaterials([]));
    }

    public function test_create_persists_without_materials_and_dispatches_event(): void
    {
        Event::fake([OrderMaterialCreated::class]);
        $order = new OrderMaterial();

        $captured = null;
        $this->orderRepo->shouldReceive('createOrderMaterial')->once()->andReturnUsing(function ($data) use (&$captured, $order) {
            $captured = $data;
            return $order;
        });

        $result = $this->service->createOrderMaterial($this->dto());

        $this->assertSame($order, $result);
        $this->assertArrayNotHasKey('materials', $captured);
        Event::assertDispatched(OrderMaterialCreated::class);
    }

    public function test_update_delegates_without_materials(): void
    {
        $order = new OrderMaterial();
        $this->orderRepo->shouldReceive('updateOrderMaterial')->once()->andReturn($order);
        $this->assertSame($order, $this->service->updateOrderMaterial($order, $this->dto()));
    }

    public function test_delete_clears_material_assignments(): void
    {
        $rel = Mockery::mock(HasMany::class);
        $rel->shouldReceive('update')->once()->with(['assigned_at' => null])->andReturn(1);
        $order = Mockery::mock(OrderMaterial::class)->makePartial();
        $order->shouldReceive('materials')->once()->andReturn($rel);

        $this->orderRepo->shouldReceive('deleteOrderMaterial')->once()->with($order)->andReturnNull();

        $this->service->deleteOrderMaterial($order);
        $this->assertTrue(true);
    }

    public function test_load_for_edit_loads_relations(): void
    {
        $order = Mockery::mock(OrderMaterial::class)->makePartial();
        $order->shouldReceive('load')->once()->with(['materials'])->andReturnSelf();
        $order->shouldReceive('loadAggregate')->andReturnSelf();

        $this->assertSame($order, $this->service->loadForEdit($order));
    }
}
