<?php

declare(strict_types=1);

namespace Tests\Feature\Inventory;

use App\Domains\Inventory\Enums\LotStatus;
use App\Domains\Inventory\Models\Item;
use App\Domains\Inventory\Models\StockLot;
use App\Domains\Inventory\Models\Store;
use App\Domains\Inventory\Models\StoreLocation;
use App\Domains\Inventory\Models\Unit;
use App\Domains\Inventory\Services\StockCardService;
use App\Domains\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Testing\TestResponse;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class StockRelocationTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private Store $store;

    private Store $otherStore;

    private StoreLocation $shelfA;

    private StoreLocation $shelfB;

    private Item $item;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = $this->userWithPermissions([
            'Inventory.Transactions.List Transactions',
            'Inventory.Transactions.Approve Transaction',
        ]);
        $this->actingAs($this->user);

        $unit = Unit::create(['name' => 'Vial', 'abbreviation' => 'vial']);
        $this->store = Store::create(['name' => 'Main Store', 'code' => 'MST', 'is_active' => true]);
        $this->otherStore = Store::create(['name' => 'Annex Store', 'code' => 'ANX', 'is_active' => true]);
        $this->shelfA = $this->location($this->store, 'A-01');
        $this->shelfB = $this->location($this->store, 'B-02');
        $this->item = Item::create([
            'item_code' => 'I-REL-001',
            'name' => 'Relocatable Reagent',
            'department' => 'LAB',
            'material_type' => 'RGT',
            'storage_condition' => 'ROOM_TEMP',
            'default_unit_id' => $unit->id,
            'is_active' => true,
        ]);
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

    private function location(Store $store, string $label): StoreLocation
    {
        return StoreLocation::create([
            'store_id' => $store->id,
            'label' => $label,
            'is_active' => true,
        ]);
    }

    private function lot(array $overrides = []): StockLot
    {
        return StockLot::create(array_merge([
            'item_id' => $this->item->id,
            'lot_number' => 'LOT-REL-1',
            'received_date' => '2026-08-01',
            'quantity_base_units' => 10,
            'unit_price_base' => 3.5,
            'store_id' => $this->store->id,
            'store_location_id' => $this->shelfA->id,
            'status' => LotStatus::ACTIVE->value,
        ], $overrides));
    }

    private function relocate(StockLot $lot, array $payload): TestResponse
    {
        return $this->post(route('inventory.lots.relocate', $lot->id), $payload);
    }

    public function test_moving_the_whole_lot_rewrites_the_lot_in_place(): void
    {
        $lot = $this->lot();

        $response = $this->relocate($lot, [
            'quantity_base_units' => 10,
            'to_store_id' => $this->store->id,
            'to_store_location_id' => $this->shelfB->id,
            'notes' => 'Freed up shelf A',
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success', true);

        $this->assertSame(1, StockLot::where('item_id', $this->item->id)->count());
        $this->assertDatabaseHas('stock_lots', [
            'id' => $lot->id,
            'store_id' => $this->store->id,
            'store_location_id' => $this->shelfB->id,
            'quantity_base_units' => '10.000000',
            'status' => LotStatus::ACTIVE->value,
        ]);
        $this->assertDatabaseHas('stock_lot_relocations', [
            'stock_lot_id' => $lot->id,
            'destination_lot_id' => null,
            'quantity_base_units' => '10.000000',
            'from_store_location_id' => $this->shelfA->id,
            'to_store_location_id' => $this->shelfB->id,
            'user_id' => $this->user->id,
            'notes' => 'Freed up shelf A',
        ]);
    }

    public function test_moving_part_of_a_lot_splits_it_and_keeps_the_total_unchanged(): void
    {
        $lot = $this->lot();

        $this->relocate($lot, [
            'quantity_base_units' => 4,
            'to_store_id' => $this->store->id,
            'to_store_location_id' => $this->shelfB->id,
        ])->assertSessionHas('success', true);

        $lots = StockLot::where('item_id', $this->item->id)->get();
        $this->assertCount(2, $lots);
        $this->assertEqualsWithDelta(10, $lots->sum(fn (StockLot $l) => (float) $l->quantity_base_units), 0.000001);

        $this->assertEqualsWithDelta(6, (float) $lot->fresh()->quantity_base_units, 0.000001);

        $moved = $lots->firstWhere('store_location_id', $this->shelfB->id);
        $this->assertNotNull($moved);
        $this->assertEqualsWithDelta(4, (float) $moved->quantity_base_units, 0.000001);
        // The split row inherits everything that identifies the stock.
        $this->assertSame($lot->lot_number, $moved->lot_number);
        $this->assertSame($lot->received_date->toDateString(), $moved->received_date->toDateString());
        $this->assertEqualsWithDelta(3.5, (float) $moved->unit_price_base, 0.000001);

        $this->assertDatabaseHas('stock_lot_relocations', [
            'stock_lot_id' => $lot->id,
            'destination_lot_id' => $moved->id,
            'quantity_base_units' => '4.000000',
        ]);
    }

    public function test_a_partial_move_folds_into_an_equivalent_lot_already_at_the_destination(): void
    {
        $lot = $this->lot();
        $existing = $this->lot([
            'quantity_base_units' => 2,
            'store_location_id' => $this->shelfB->id,
        ]);

        $this->relocate($lot, [
            'quantity_base_units' => 3,
            'to_store_id' => $this->store->id,
            'to_store_location_id' => $this->shelfB->id,
        ])->assertSessionHas('success', true);

        $this->assertSame(2, StockLot::where('item_id', $this->item->id)->count());
        $this->assertEqualsWithDelta(7, (float) $lot->fresh()->quantity_base_units, 0.000001);
        $this->assertEqualsWithDelta(5, (float) $existing->fresh()->quantity_base_units, 0.000001);
    }

    public function test_stock_can_be_moved_to_another_store(): void
    {
        $lot = $this->lot();
        $annexShelf = $this->location($this->otherStore, 'X-09');

        $this->relocate($lot, [
            'quantity_base_units' => 10,
            'to_store_id' => $this->otherStore->id,
            'to_store_location_id' => $annexShelf->id,
        ])->assertSessionHas('success', true);

        $this->assertDatabaseHas('stock_lots', [
            'id' => $lot->id,
            'store_id' => $this->otherStore->id,
            'store_location_id' => $annexShelf->id,
        ]);
    }

    public function test_a_split_lot_is_not_double_counted_in_the_current_stock_totals(): void
    {
        $lot = $this->lot();

        $this->relocate($lot, [
            'quantity_base_units' => 4,
            'to_store_id' => $this->store->id,
            'to_store_location_id' => $this->shelfB->id,
        ])->assertSessionHas('success', true);

        $stockCards = app(StockCardService::class);

        // One row for the item, holding the untouched total across both shelves.
        $rows = $stockCards->getCurrentStock()->where('item.id', $this->item->id);
        $this->assertCount(1, $rows);
        $this->assertEqualsWithDelta(10, (float) $rows->first()['total_base'], 0.000001);

        // Filtering by location reports only what sits there.
        foreach ([[$this->shelfA->id, 6], [$this->shelfB->id, 4]] as [$locationId, $expected]) {
            $scoped = $stockCards
                ->getCurrentStock($this->store->id, ['location_id' => $locationId])
                ->where('item.id', $this->item->id);

            $this->assertCount(1, $scoped);
            $this->assertEqualsWithDelta($expected, (float) $scoped->first()['total_base'], 0.000001);
        }

        // Searching the lot number now matches two lot rows — still one item row.
        $searched = $stockCards
            ->getCurrentStock(null, ['search' => $lot->lot_number])
            ->where('item.id', $this->item->id);
        $this->assertCount(1, $searched);
        $this->assertEqualsWithDelta(10, (float) $searched->first()['total_base'], 0.000001);
    }

    public function test_moving_stock_out_of_a_store_reopens_its_reorder_alert(): void
    {
        Notification::fake();
        // The alert service notifies whoever holds this permission.
        Permission::findOrCreate('Inventory.ReorderAlerts.View Reorder Alerts');
        $this->item->update(['minimum_stock_level' => 5]);
        $lot = $this->lot();

        $this->relocate($lot, [
            'quantity_base_units' => 10,
            'to_store_id' => $this->otherStore->id,
        ])->assertSessionHas('success', true);

        // The main store now holds nothing, which is under its minimum.
        $this->assertDatabaseHas('reorder_alerts', [
            'item_id' => $this->item->id,
            'store_id' => $this->store->id,
            'status' => 'OPEN',
        ]);
    }

    public function test_a_move_within_one_store_leaves_reorder_alerts_alone(): void
    {
        Notification::fake();
        $this->item->update(['minimum_stock_level' => 5]);
        $lot = $this->lot(['quantity_base_units' => 2]);

        $this->relocate($lot, [
            'quantity_base_units' => 2,
            'to_store_id' => $this->store->id,
            'to_store_location_id' => $this->shelfB->id,
        ])->assertSessionHas('success', true);

        // Stock never left the store, so its level has not changed.
        $this->assertDatabaseCount('reorder_alerts', 0);
    }

    public function test_more_stock_than_the_lot_holds_cannot_be_moved(): void
    {
        $lot = $this->lot();

        $this->relocate($lot, [
            'quantity_base_units' => 11,
            'to_store_id' => $this->store->id,
            'to_store_location_id' => $this->shelfB->id,
        ])->assertSessionHas('success', false);

        $this->assertDatabaseHas('stock_lots', [
            'id' => $lot->id,
            'store_location_id' => $this->shelfA->id,
            'quantity_base_units' => '10.000000',
        ]);
        $this->assertDatabaseCount('stock_lot_relocations', 0);
    }

    public function test_a_location_from_another_store_is_rejected(): void
    {
        $lot = $this->lot();

        $this->relocate($lot, [
            'quantity_base_units' => 5,
            // shelfB belongs to the main store, not the annex.
            'to_store_id' => $this->otherStore->id,
            'to_store_location_id' => $this->shelfB->id,
        ])->assertSessionHas('success', false);

        $this->assertDatabaseHas('stock_lots', [
            'id' => $lot->id,
            'store_id' => $this->store->id,
            'store_location_id' => $this->shelfA->id,
        ]);
    }

    public function test_moving_stock_to_where_it_already_is_is_rejected(): void
    {
        $lot = $this->lot();

        $this->relocate($lot, [
            'quantity_base_units' => 5,
            'to_store_id' => $this->store->id,
            'to_store_location_id' => $this->shelfA->id,
        ])->assertSessionHas('success', false);

        $this->assertDatabaseCount('stock_lot_relocations', 0);
    }

    public function test_only_active_stock_can_be_moved(): void
    {
        $lot = $this->lot(['status' => LotStatus::QUARANTINE->value]);

        $this->relocate($lot, [
            'quantity_base_units' => 10,
            'to_store_id' => $this->store->id,
            'to_store_location_id' => $this->shelfB->id,
        ])->assertSessionHas('success', false);

        $this->assertDatabaseHas('stock_lots', [
            'id' => $lot->id,
            'store_location_id' => $this->shelfA->id,
        ]);
    }

    public function test_a_zero_quantity_is_rejected_by_validation(): void
    {
        $lot = $this->lot();

        $this->relocate($lot, [
            'quantity_base_units' => 0,
            'to_store_id' => $this->store->id,
        ])->assertSessionHasErrors('quantity_base_units');
    }

    public function test_users_without_approval_clearance_cannot_move_stock(): void
    {
        $this->actingAs($this->userWithPermissions(['Inventory.Transactions.List Transactions']));
        $lot = $this->lot();

        $this->relocate($lot, [
            'quantity_base_units' => 10,
            'to_store_id' => $this->store->id,
            'to_store_location_id' => $this->shelfB->id,
        ])->assertForbidden();

        $this->assertDatabaseCount('stock_lot_relocations', 0);
    }
}
