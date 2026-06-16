<?php

namespace Tests\Feature\Inventory;

use App\Domains\Inventory\Models\Item;
use App\Domains\Inventory\Models\Unit;
use App\Domains\Inventory\Repositories\ItemRepository;
use App\Domains\Inventory\Services\ItemCodeService;
use App\Domains\Inventory\Services\ItemService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Pagination\LengthAwarePaginator;
use Mockery;
use Tests\TestCase;

class ItemServiceTest extends TestCase
{
    use RefreshDatabase;

    private ItemRepository $repo;
    private ItemService $service;

    protected function setUp(): void
    {
        parent::setUp();
        // ItemCodeService is a readonly class (cannot be mocked); use the real one.
        $this->repo = Mockery::mock(ItemRepository::class);
        $this->service = new ItemService($this->repo, new ItemCodeService());
    }

    public function test_list_delegates(): void
    {
        $paginator = new LengthAwarePaginator([], 0, 10);
        $this->repo->shouldReceive('listItems')->once()->andReturn($paginator);
        $this->assertSame($paginator, $this->service->listItems([]));
    }

    public function test_create_generates_item_code_then_persists(): void
    {
        // Real ItemCodeService against an empty items table → first code.
        $captured = null;
        $this->repo->shouldReceive('createItem')->once()->andReturnUsing(function ($data) use (&$captured) {
            $captured = $data;
            return new Item();
        });

        $this->service->createItem(['department' => 'LAB', 'material_type' => 'CHM', 'name' => 'X']);

        $this->assertSame('LAB-CHM-000001', $captured['item_code']);
    }

    public function test_update_delegates(): void
    {
        $item = new Item();
        $this->repo->shouldReceive('updateItem')->once()->with($item, ['name' => 'Y'])->andReturn($item);
        $this->assertSame($item, $this->service->updateItem($item, ['name' => 'Y']));
    }

    public function test_delete_delegates(): void
    {
        $item = new Item();
        $this->repo->shouldReceive('deleteItem')->once()->with($item)->andReturnNull();
        $this->service->deleteItem($item);
        $this->assertTrue(true);
    }

    public function test_get_item_by_id_loads_relations(): void
    {
        $unit = Unit::create(['name' => 'Box', 'abbreviation' => 'bx']);
        $item = Item::create([
            'item_code'         => 'I-GET-1',
            'name'              => 'Lookup',
            'department'        => 'LAB',
            'material_type'     => 'CHM',
            'storage_condition' => 'ROOM_TEMP',
            'default_unit_id'   => $unit->id,
            'is_active'         => true,
        ]);

        $found = $this->service->getItemById($item->id);
        $this->assertSame($item->id, $found->id);
        $this->assertTrue($found->relationLoaded('defaultUnit'));
    }
}
