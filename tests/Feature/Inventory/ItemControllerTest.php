<?php

namespace Tests\Feature\Inventory;

use App\Domains\Inventory\Models\Item;
use App\Domains\Inventory\Models\Unit;
use App\Domains\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class ItemControllerTest extends TestCase
{
    use RefreshDatabase;

    private Unit $defaultUnit;
    private Unit $boxUnit;

    protected function setUp(): void
    {
        parent::setUp();
        $this->actingAs($this->userWithPermissions([
            'Inventory.Items.Create Item',
            'Inventory.Items.Edit Item',
        ]));

        $this->defaultUnit = Unit::create(['name' => 'Gram', 'abbreviation' => 'g']);
        $this->boxUnit = Unit::create(['name' => 'Box', 'abbreviation' => 'bx']);
    }

    private function userWithPermissions(array $permissions): User
    {
        $user = User::factory()->create();
        foreach ($permissions as $permission) {
            Permission::findOrCreate($permission);
            $user->givePermissionTo($permission);
        }
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return $user;
    }

    private function storePayload(array $overrides = []): array
    {
        return array_merge([
            'name'              => 'Item ' . Str::random(4),
            'department'        => 'LAB',
            'material_type'     => 'CHM',
            'storage_condition' => 'ROOM_TEMP',
            'default_unit_id'   => $this->defaultUnit->id,
        ], $overrides);
    }

    private function createItem(): Item
    {
        return Item::create([
            'item_code'         => 'I-' . Str::random(6),
            'name'              => 'Existing Item',
            'department'        => 'LAB',
            'material_type'     => 'CHM',
            'storage_condition' => 'ROOM_TEMP',
            'default_unit_id'   => $this->defaultUnit->id,
            'is_active'         => true,
        ]);
    }

    private function updatePayload(array $overrides = []): array
    {
        return array_merge([
            'name'              => 'Updated Item',
            'storage_condition' => 'ROOM_TEMP',
            'default_unit_id'   => $this->defaultUnit->id,
        ], $overrides);
    }

    public function test_store_rejects_duplicate_conversion_units(): void
    {
        $this->post(route('inventory.items.store'), $this->storePayload([
            'unit_conversions' => [
                ['unit_id' => $this->boxUnit->id, 'conversion_to_base' => 10],
                ['unit_id' => $this->boxUnit->id, 'conversion_to_base' => 20],
            ],
        ]))->assertSessionHasErrors('unit_conversions.1.unit_id');

        $this->assertDatabaseCount('items', 0);
        $this->assertDatabaseCount('item_unit_conversions', 0);
    }

    public function test_store_rejects_conversion_unit_matching_default_unit(): void
    {
        $this->post(route('inventory.items.store'), $this->storePayload([
            'unit_conversions' => [
                ['unit_id' => $this->defaultUnit->id, 'conversion_to_base' => 1],
            ],
        ]))->assertSessionHasErrors('unit_conversions.0.unit_id');

        $this->assertDatabaseCount('items', 0);
        $this->assertDatabaseCount('item_unit_conversions', 0);
    }

    public function test_update_rejects_duplicate_conversion_units(): void
    {
        $item = $this->createItem();

        $this->put(route('inventory.items.update', $item->id), $this->updatePayload([
            'unit_conversions' => [
                ['unit_id' => $this->boxUnit->id, 'conversion_to_base' => 10],
                ['unit_id' => $this->boxUnit->id, 'conversion_to_base' => 20],
            ],
        ]))->assertSessionHasErrors('unit_conversions.1.unit_id');

        $this->assertDatabaseCount('item_unit_conversions', 0);
    }

    public function test_update_rejects_conversion_unit_matching_default_unit(): void
    {
        $item = $this->createItem();

        $this->put(route('inventory.items.update', $item->id), $this->updatePayload([
            'unit_conversions' => [
                ['unit_id' => $this->defaultUnit->id, 'conversion_to_base' => 1],
            ],
        ]))->assertSessionHasErrors('unit_conversions.0.unit_id');

        $this->assertDatabaseCount('item_unit_conversions', 0);
    }

    public function test_update_accepts_distinct_non_default_conversion_units(): void
    {
        $item = $this->createItem();
        $literUnit = Unit::create(['name' => 'Liter', 'abbreviation' => 'L']);

        $this->put(route('inventory.items.update', $item->id), $this->updatePayload([
            'unit_conversions' => [
                ['unit_id' => $this->boxUnit->id, 'conversion_to_base' => 10],
                ['unit_id' => $literUnit->id, 'conversion_to_base' => 5],
            ],
        ]))->assertSessionHasNoErrors()->assertRedirect();

        $this->assertDatabaseCount('item_unit_conversions', 2);
    }
}
