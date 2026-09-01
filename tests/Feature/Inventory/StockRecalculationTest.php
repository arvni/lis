<?php

declare(strict_types=1);

namespace Tests\Feature\Inventory;

use App\Domains\Inventory\Enums\LotStatus;
use App\Domains\Inventory\Enums\TransactionStatus;
use App\Domains\Inventory\Enums\TransactionType;
use App\Domains\Inventory\Models\Item;
use App\Domains\Inventory\Models\StockLot;
use App\Domains\Inventory\Models\StockTransaction;
use App\Domains\Inventory\Models\StockTransactionLine;
use App\Domains\Inventory\Models\Store;
use App\Domains\Inventory\Models\Unit;
use App\Domains\Inventory\Services\StockLedgerReplayService;
use App\Domains\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Testing\TestResponse;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class StockRecalculationTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private Store $store;

    private Store $otherStore;

    private Item $item;

    private Unit $unit;

    protected function setUp(): void
    {
        parent::setUp();

        Notification::fake();
        Permission::findOrCreate('Inventory.ReorderAlerts.View Reorder Alerts');

        $this->user = $this->userWithPermissions([
            'Inventory.Transactions.List Transactions',
            'Inventory.Transactions.Approve Transaction',
        ]);
        $this->actingAs($this->user);

        $this->unit = Unit::create(['name' => 'Vial', 'abbreviation' => 'vial']);
        $this->store = Store::create(['name' => 'Main Store', 'code' => 'MST', 'is_active' => true]);
        $this->otherStore = Store::create(['name' => 'Annex Store', 'code' => 'ANX', 'is_active' => true]);
        $this->item = Item::create([
            'item_code' => 'I-RECON-001',
            'name' => 'Reconcilable Reagent',
            'department' => 'LAB',
            'material_type' => 'RGT',
            'storage_condition' => 'ROOM_TEMP',
            'default_unit_id' => $this->unit->id,
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

    /**
     * Writes an approved transaction with a single line, without going through
     * StockMutationService — so the ledger exists but the lots do not follow
     * from it, which is exactly the drift a recalculation has to find.
     */
    private function transaction(TransactionType $type, array $line, array $overrides = []): StockTransaction
    {
        $tx = StockTransaction::create(array_merge([
            'transaction_type' => $type->value,
            'reference_number' => $type->referencePrefix().'-'.uniqid(),
            'transaction_date' => '2026-08-01',
            'store_id' => $this->store->id,
            'requested_by_user_id' => $this->user->id,
            'status' => TransactionStatus::APPROVED->value,
        ], $overrides));

        StockTransactionLine::create(array_merge([
            'transaction_id' => $tx->id,
            'item_id' => $this->item->id,
            'unit_id' => $this->unit->id,
            'quantity' => $line['quantity_base_units'],
        ], $line));

        return $tx;
    }

    private function lot(array $overrides = []): StockLot
    {
        return StockLot::create(array_merge([
            'item_id' => $this->item->id,
            'lot_number' => 'LOT-A',
            'received_date' => '2026-08-01',
            'quantity_base_units' => 10,
            'unit_price_base' => 2,
            'store_id' => $this->store->id,
            'status' => LotStatus::ACTIVE->value,
        ], $overrides));
    }

    private function recalculate(array $payload = []): TestResponse
    {
        return $this->post(route('inventory.stock.recalculate', $this->item->id), $payload);
    }

    private function activeTotal(?Store $store = null): float
    {
        return (float) StockLot::where('item_id', $this->item->id)
            ->where('store_id', ($store ?? $this->store)->id)
            ->where('status', LotStatus::ACTIVE->value)
            ->sum('quantity_base_units');
    }

    public function test_the_ledger_replay_nets_entries_against_exports(): void
    {
        $this->transaction(TransactionType::ENTRY, ['quantity_base_units' => 30, 'lot_number' => 'LOT-A']);
        $this->transaction(TransactionType::EXPORT, ['quantity_base_units' => 12], ['transaction_date' => '2026-08-05']);

        $expected = app(StockLedgerReplayService::class)->expectedByStore($this->item->id);

        $this->assertEqualsWithDelta(18, $expected[$this->store->id], 0.000001);
    }

    public function test_an_adjustment_sets_an_absolute_quantity_rather_than_a_delta(): void
    {
        $this->transaction(TransactionType::ENTRY, ['quantity_base_units' => 30, 'lot_number' => 'LOT-A']);
        // The adjustment declares the lot holds 7, whatever came before it.
        $this->transaction(TransactionType::ADJUST, ['quantity_base_units' => 7, 'lot_number' => 'LOT-A'], ['transaction_date' => '2026-08-09']);

        $expected = app(StockLedgerReplayService::class)->expectedByStore($this->item->id);

        $this->assertEqualsWithDelta(7, $expected[$this->store->id], 0.000001);
    }

    public function test_transferred_stock_only_counts_once_the_receipt_is_confirmed(): void
    {
        $this->transaction(TransactionType::ENTRY, ['quantity_base_units' => 20, 'lot_number' => 'LOT-A']);
        $transfer = $this->transaction(
            TransactionType::TRANSFER,
            ['quantity_base_units' => 8],
            ['transaction_date' => '2026-08-06', 'destination_store_id' => $this->otherStore->id],
        );

        $replay = app(StockLedgerReplayService::class);

        $pending = $replay->expectedByStore($this->item->id);
        $this->assertEqualsWithDelta(12, $pending[$this->store->id], 0.000001);
        // Still in quarantine at the annex, so it is not current stock yet.
        $this->assertEqualsWithDelta(0, $pending[$this->otherStore->id] ?? 0, 0.000001);

        $transfer->update(['transfer_received_at' => now()]);

        $received = $replay->expectedByStore($this->item->id);
        $this->assertEqualsWithDelta(8, $received[$this->otherStore->id], 0.000001);
    }

    public function test_surplus_on_the_shelves_is_drawn_down_to_match_the_ledger(): void
    {
        $this->transaction(TransactionType::ENTRY, ['quantity_base_units' => 10, 'lot_number' => 'LOT-A']);
        // The lots claim 25 while the ledger only accounts for 10.
        $this->lot(['quantity_base_units' => 25]);

        $this->recalculate()->assertSessionHas('success', true);

        $this->assertEqualsWithDelta(10, $this->activeTotal(), 0.000001);
        $this->assertDatabaseHas('stock_reconciliations', [
            'item_id' => $this->item->id,
            'store_id' => $this->store->id,
            'previous_base_units' => '25.000000',
            'expected_base_units' => '10.000000',
            'difference_base_units' => '-15.000000',
            'user_id' => $this->user->id,
        ]);
    }

    public function test_a_shortfall_is_added_back_onto_the_newest_lot(): void
    {
        $this->transaction(TransactionType::ENTRY, ['quantity_base_units' => 40, 'lot_number' => 'LOT-A']);
        $lot = $this->lot(['quantity_base_units' => 15]);

        $this->recalculate()->assertSessionHas('success', true);

        $this->assertEqualsWithDelta(40, $this->activeTotal(), 0.000001);
        // Corrected in place rather than by inventing a separate lot row.
        $this->assertSame(1, StockLot::where('item_id', $this->item->id)->count());
        $this->assertEqualsWithDelta(40, (float) $lot->fresh()->quantity_base_units, 0.000001);
    }

    public function test_a_store_holding_no_lots_gets_one_opened_for_the_balance(): void
    {
        $this->transaction(TransactionType::ENTRY, ['quantity_base_units' => 12, 'lot_number' => 'LOT-A']);

        $this->recalculate()->assertSessionHas('success', true);

        $this->assertEqualsWithDelta(12, $this->activeTotal(), 0.000001);
        $this->assertDatabaseHas('stock_lots', [
            'item_id' => $this->item->id,
            'store_id' => $this->store->id,
            'status' => LotStatus::ACTIVE->value,
        ]);
    }

    public function test_matching_stock_is_left_untouched_and_records_no_correction(): void
    {
        $this->transaction(TransactionType::ENTRY, ['quantity_base_units' => 10, 'lot_number' => 'LOT-A']);
        $lot = $this->lot(['quantity_base_units' => 10]);

        $this->recalculate()->assertSessionHas('success', true);

        $this->assertEqualsWithDelta(10, (float) $lot->fresh()->quantity_base_units, 0.000001);
        $this->assertDatabaseCount('stock_reconciliations', 0);
    }

    public function test_a_relocation_is_credited_to_the_store_that_received_it(): void
    {
        $this->transaction(TransactionType::ENTRY, ['quantity_base_units' => 20, 'lot_number' => 'LOT-A']);
        $lot = $this->lot(['quantity_base_units' => 20]);

        // Move half to the annex — no transaction is written for this.
        $this->post(route('inventory.lots.relocate', $lot->id), [
            'quantity_base_units' => 8,
            'to_store_id' => $this->otherStore->id,
        ])->assertSessionHas('success', true);

        $expected = app(StockLedgerReplayService::class)->expectedByStore($this->item->id);

        $this->assertEqualsWithDelta(12, $expected[$this->store->id], 0.000001);
        $this->assertEqualsWithDelta(8, $expected[$this->otherStore->id], 0.000001);

        // A recalculation right after a relocation must therefore change nothing.
        $this->recalculate();
        $this->assertDatabaseCount('stock_reconciliations', 0);
        $this->assertEqualsWithDelta(12, $this->activeTotal(), 0.000001);
        $this->assertEqualsWithDelta(8, $this->activeTotal($this->otherStore), 0.000001);
    }

    public function test_a_store_filter_limits_the_recalculation_to_that_store(): void
    {
        $this->transaction(TransactionType::ENTRY, ['quantity_base_units' => 10, 'lot_number' => 'LOT-A']);
        $this->lot(['quantity_base_units' => 25]);
        $this->lot(['quantity_base_units' => 9, 'lot_number' => 'LOT-B', 'store_id' => $this->otherStore->id]);

        $this->recalculate(['store_id' => $this->store->id])->assertSessionHas('success', true);

        $this->assertEqualsWithDelta(10, $this->activeTotal(), 0.000001);
        // The annex was out of scope, so its unexplained stock is left alone.
        $this->assertEqualsWithDelta(9, $this->activeTotal($this->otherStore), 0.000001);
        $this->assertDatabaseCount('stock_reconciliations', 1);
    }

    public function test_users_without_approval_clearance_cannot_recalculate(): void
    {
        $this->actingAs($this->userWithPermissions(['Inventory.Transactions.List Transactions']));
        $this->lot(['quantity_base_units' => 25]);

        $this->recalculate()->assertForbidden();

        $this->assertEqualsWithDelta(25, $this->activeTotal(), 0.000001);
        $this->assertDatabaseCount('stock_reconciliations', 0);
    }
}
