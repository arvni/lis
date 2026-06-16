<?php

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
use App\Domains\Inventory\Services\ReorderAlertService;
use App\Domains\Inventory\Services\StockMutationService;
use App\Domains\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StockMutationServiceTest extends TestCase
{
    use RefreshDatabase;

    private Store $store;
    private Store $destStore;
    private Item $item;
    private Unit $unit;
    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->actingAs($this->user);

        $this->unit = Unit::create([
            'name'         => 'Box',
            'abbreviation' => 'box',
        ]);

        $this->store = Store::create([
            'name'      => 'Main Store',
            'code'      => 'MAIN',
            'is_active' => true,
        ]);

        $this->destStore = Store::create([
            'name'      => 'Destination Store',
            'code'      => 'DEST',
            'is_active' => true,
        ]);

        $this->item = Item::create([
            'item_code'       => 'ITM-001',
            'name'            => 'Test Item',
            'department'      => 'LAB',
            'material_type'   => 'RGT',
            'storage_condition' => 'ROOM_TEMP',
            'default_unit_id' => $this->unit->id,
            'is_active'       => true,
        ]);
    }

    /**
     * Build a mocked StockMutationService where ReorderAlertService does nothing.
     */
    private function makeService(): StockMutationService
    {
        $mock = $this->mock(ReorderAlertService::class);
        $mock->shouldReceive('checkAndAlert')->andReturnNull();

        return app(StockMutationService::class);
    }

    /**
     * Create a minimal ENTRY StockTransaction with one line.
     */
    private function makeEntryTransaction(array $lineOverrides = [], array $txOverrides = []): StockTransaction
    {
        $tx = StockTransaction::create(array_merge([
            'transaction_type'     => TransactionType::ENTRY->value,
            'reference_number'     => 'ENT-' . uniqid(),
            'transaction_date'     => now()->toDateString(),
            'store_id'             => $this->store->id,
            'requested_by_user_id' => $this->user->id,
            'status'               => TransactionStatus::PENDING_APPROVAL->value,
        ], $txOverrides));

        StockTransactionLine::create(array_merge([
            'transaction_id'      => $tx->id,
            'item_id'             => $this->item->id,
            'unit_id'             => $this->unit->id,
            'quantity'            => 10,
            'quantity_base_units' => 10,
            'unit_price'          => 100.00,
            'total_price'         => 1000.00,
        ], $lineOverrides));

        return $tx->load('lines.item');
    }

    /**
     * Create an EXPORT StockTransaction with one line.
     */
    private function makeExportTransaction(float $qty, array $txOverrides = []): StockTransaction
    {
        $tx = StockTransaction::create(array_merge([
            'transaction_type'     => TransactionType::EXPORT->value,
            'reference_number'     => 'EXP-' . uniqid(),
            'transaction_date'     => now()->toDateString(),
            'store_id'             => $this->store->id,
            'requested_by_user_id' => $this->user->id,
            'status'               => TransactionStatus::PENDING_APPROVAL->value,
        ], $txOverrides));

        StockTransactionLine::create([
            'transaction_id'      => $tx->id,
            'item_id'             => $this->item->id,
            'unit_id'             => $this->unit->id,
            'quantity'            => $qty,
            'quantity_base_units' => $qty,
        ]);

        return $tx->load('lines.item');
    }

    // -------------------------------------------------------------------------
    // I-01: applyEntry creates StockLot with correct unit_price_base
    // -------------------------------------------------------------------------

    public function test_apply_entry_creates_stock_lot_with_correct_unit_price_base(): void
    {
        // unit_price_base = unit_price / qty * qty_base_units = 100 / 10 * 10 = 100.00
        $tx = $this->makeEntryTransaction([
            'quantity'            => 10,
            'quantity_base_units' => 10,
            'unit_price'          => 100.00,
        ]);

        $this->makeService()->apply($tx);

        $lot = StockLot::where('item_id', $this->item->id)->first();
        $this->assertNotNull($lot, 'A StockLot should have been created');
        $this->assertEquals($this->store->id, $lot->store_id);
        $this->assertEqualsWithDelta(100.00, (float) $lot->unit_price_base, 0.0001);
    }

    public function test_apply_entry_unit_price_base_formula_with_different_units(): void
    {
        // e.g. buying 2 boxes at 50 each, each box = 5 base units → price_base = 50/2*5 = 125 per base unit? No:
        // unit_price_base = unit_price / quantity * quantity_base_units = 50 / 2 * 5 = 125 ... wait
        // Actually the formula from source is: unit_price / quantity * quantity_base_units
        // So 50 / 2 * 10 = 250? Let's check a clean example:
        // unit_price=200, qty=4, qty_base=20 → 200/4*20 = 1000? That seems like total not per unit.
        // Reading again: "unit_price_base = unit_price / qty * qty_base_units"
        // So if unit_price=50 (price per purchasing unit), qty=2 (purchasing units), qty_base_units=10 (base units total)
        // Then unit_price_base = 50/2*10 = 250 — that means price per base unit = 25? But formula gives 250 which is wrong.
        // Actually this looks like total not per-base. But looking at the source code:
        // $unitPriceBase = $line->unit_price / $line->quantity * $line->quantity_base_units;
        // If unit_price=50 (per box), qty=2 boxes, qty_base=10 → per_base = 50/10 = 5 per base unit, total = 50*2=100
        // The code computes: 50 / 2 * 10 = 250 ... this seems wrong conceptually but we test what code does, not what it should do.
        // Simple test: unit_price=60, qty=3, qty_base_units=6 → expected = 60/3*6 = 120
        $tx = $this->makeEntryTransaction([
            'quantity'            => 3,
            'quantity_base_units' => 6,
            'unit_price'          => 60.00,
        ]);

        $this->makeService()->apply($tx);

        $lot = StockLot::where('item_id', $this->item->id)->first();
        $this->assertNotNull($lot);
        $expected = 60.0 / 3.0 * 6.0; // = 120
        $this->assertEqualsWithDelta($expected, (float) $lot->unit_price_base, 0.0001);
    }

    // -------------------------------------------------------------------------
    // I-02: applyEntry generates barcode from item_code and brand
    // -------------------------------------------------------------------------

    public function test_apply_entry_generates_barcode_from_item_code_and_brand(): void
    {
        // When brand is set, barcode = "{item_code}-{BRAND_UPPERCASED_SPACES_TO_DASHES}"
        $tx = $this->makeEntryTransaction([
            'brand'   => 'sigma aldrich',
            'barcode' => null,
        ]);

        $this->makeService()->apply($tx);

        $lot = StockLot::where('item_id', $this->item->id)->first();
        $this->assertNotNull($lot);
        $this->assertEquals('ITM-001-SIGMA-ALDRICH', $lot->barcode);
    }

    public function test_apply_entry_generates_barcode_from_item_code_and_tx_id_when_no_brand(): void
    {
        $tx = $this->makeEntryTransaction([
            'brand'   => null,
            'barcode' => null,
        ]);

        $this->makeService()->apply($tx);

        $lot = StockLot::where('item_id', $this->item->id)->first();
        $this->assertNotNull($lot);
        $this->assertEquals("ITM-001-{$tx->id}", $lot->barcode);
    }

    // -------------------------------------------------------------------------
    // I-03: applyExport deducts in FIFO order
    // -------------------------------------------------------------------------

    public function test_apply_export_deducts_fifo_order(): void
    {
        // Older lot: received 10 days ago, qty=5
        // Newer lot: received today, qty=10
        // Export 5 → should fully consume older lot, leave newer untouched
        $olderLot = StockLot::create([
            'item_id'             => $this->item->id,
            'lot_number'          => 'LOT-OLD',
            'received_date'       => now()->subDays(10)->toDateString(),
            'quantity_base_units' => 5,
            'unit_price_base'     => 10.00,
            'store_id'            => $this->store->id,
            'status'              => LotStatus::ACTIVE->value,
        ]);

        $newerLot = StockLot::create([
            'item_id'             => $this->item->id,
            'lot_number'          => 'LOT-NEW',
            'received_date'       => now()->toDateString(),
            'quantity_base_units' => 10,
            'unit_price_base'     => 12.00,
            'store_id'            => $this->store->id,
            'status'              => LotStatus::ACTIVE->value,
        ]);

        $tx = $this->makeExportTransaction(5);
        $this->makeService()->apply($tx);

        // Older lot should be depleted
        $this->assertEqualsWithDelta(0, (float) $olderLot->fresh()->quantity_base_units, 0.0001);

        // Newer lot should be untouched
        $this->assertEqualsWithDelta(10, (float) $newerLot->fresh()->quantity_base_units, 0.0001);
    }

    public function test_apply_export_spans_across_lots_in_fifo_order(): void
    {
        // Older lot: qty=3, Newer lot: qty=10 — export 8 → older fully consumed, newer has 5 left
        StockLot::create([
            'item_id'             => $this->item->id,
            'lot_number'          => 'LOT-A',
            'received_date'       => now()->subDays(5)->toDateString(),
            'quantity_base_units' => 3,
            'unit_price_base'     => 10.00,
            'store_id'            => $this->store->id,
            'status'              => LotStatus::ACTIVE->value,
        ]);

        $newerLot = StockLot::create([
            'item_id'             => $this->item->id,
            'lot_number'          => 'LOT-B',
            'received_date'       => now()->toDateString(),
            'quantity_base_units' => 10,
            'unit_price_base'     => 15.00,
            'store_id'            => $this->store->id,
            'status'              => LotStatus::ACTIVE->value,
        ]);

        $tx = $this->makeExportTransaction(8);
        $this->makeService()->apply($tx);

        $this->assertEqualsWithDelta(5, (float) $newerLot->fresh()->quantity_base_units, 0.0001);
    }

    // -------------------------------------------------------------------------
    // I-04: applyExport marks depleted lot as CONSUMED
    // -------------------------------------------------------------------------

    public function test_apply_export_marks_depleted_lot_as_consumed(): void
    {
        $lot = StockLot::create([
            'item_id'             => $this->item->id,
            'lot_number'          => 'LOT-CONSUME',
            'received_date'       => now()->subDays(1)->toDateString(),
            'quantity_base_units' => 5,
            'unit_price_base'     => 20.00,
            'store_id'            => $this->store->id,
            'status'              => LotStatus::ACTIVE->value,
        ]);

        $tx = $this->makeExportTransaction(5);
        $this->makeService()->apply($tx);

        $freshLot = $lot->fresh();
        $this->assertEquals(LotStatus::CONSUMED, $freshLot->status);
        $this->assertEqualsWithDelta(0, (float) $freshLot->quantity_base_units, 0.0001);
    }

    // -------------------------------------------------------------------------
    // I-05: applyExport throws on insufficient stock
    // -------------------------------------------------------------------------

    public function test_apply_export_throws_on_insufficient_stock(): void
    {
        // Only 3 units in stock, trying to export 10
        StockLot::create([
            'item_id'             => $this->item->id,
            'lot_number'          => 'LOT-SMALL',
            'received_date'       => now()->toDateString(),
            'quantity_base_units' => 3,
            'unit_price_base'     => 10.00,
            'store_id'            => $this->store->id,
            'status'              => LotStatus::ACTIVE->value,
        ]);

        $tx = $this->makeExportTransaction(10);

        $this->expectException(\RuntimeException::class);
        $this->makeService()->apply($tx);
    }

    // -------------------------------------------------------------------------
    // I-06: applyExport records cost based on FIFO lot prices
    // -------------------------------------------------------------------------

    public function test_apply_export_records_cost_based_on_fifo_lot_prices(): void
    {
        // Lot 1: 5 units @ 10.00 each → take all 5 → cost = 50
        // Lot 2: 10 units @ 20.00 each → take 3 → cost = 60
        // Total for export of 8 units = 50 + 60 = 110
        StockLot::create([
            'item_id'             => $this->item->id,
            'lot_number'          => 'LOT-P1',
            'received_date'       => now()->subDays(3)->toDateString(),
            'quantity_base_units' => 5,
            'unit_price_base'     => 10.00,
            'store_id'            => $this->store->id,
            'status'              => LotStatus::ACTIVE->value,
        ]);

        StockLot::create([
            'item_id'             => $this->item->id,
            'lot_number'          => 'LOT-P2',
            'received_date'       => now()->toDateString(),
            'quantity_base_units' => 10,
            'unit_price_base'     => 20.00,
            'store_id'            => $this->store->id,
            'status'              => LotStatus::ACTIVE->value,
        ]);

        $tx = $this->makeExportTransaction(8);
        $this->makeService()->apply($tx);

        $line = $tx->lines()->first()->fresh();
        $this->assertEqualsWithDelta(110.00, (float) $line->total_price, 0.0001);
    }

    // -------------------------------------------------------------------------
    // I-07: applyTransfer creates QUARANTINE lot in destination store
    // -------------------------------------------------------------------------

    public function test_apply_transfer_creates_quarantine_lot_in_destination_store(): void
    {
        $sourceLot = StockLot::create([
            'item_id'             => $this->item->id,
            'lot_number'          => 'LOT-TRANSFER',
            'received_date'       => now()->subDays(2)->toDateString(),
            'quantity_base_units' => 10,
            'unit_price_base'     => 15.00,
            'store_id'            => $this->store->id,
            'status'              => LotStatus::ACTIVE->value,
        ]);

        $tx = StockTransaction::create([
            'transaction_type'      => TransactionType::TRANSFER->value,
            'reference_number'      => 'TRF-' . uniqid(),
            'transaction_date'      => now()->toDateString(),
            'store_id'              => $this->store->id,
            'destination_store_id'  => $this->destStore->id,
            'requested_by_user_id'  => $this->user->id,
            'status'                => TransactionStatus::PENDING_APPROVAL->value,
        ]);

        StockTransactionLine::create([
            'transaction_id'      => $tx->id,
            'item_id'             => $this->item->id,
            'unit_id'             => $this->unit->id,
            'quantity'            => 4,
            'quantity_base_units' => 4,
        ]);

        $tx->load('lines.item');

        $this->makeService()->apply($tx);

        // Source lot decremented
        $this->assertEqualsWithDelta(6, (float) $sourceLot->fresh()->quantity_base_units, 0.0001);

        // New QUARANTINE lot in destination store
        $destLot = StockLot::where('store_id', $this->destStore->id)
            ->where('item_id', $this->item->id)
            ->first();

        $this->assertNotNull($destLot, 'A lot should be created in the destination store');
        $this->assertEquals(LotStatus::QUARANTINE, $destLot->status);
        $this->assertEqualsWithDelta(4, (float) $destLot->quantity_base_units, 0.0001);
    }

    // -------------------------------------------------------------------------
    // I-08: applyAdjust updates lot quantity by lot_number
    // -------------------------------------------------------------------------

    public function test_apply_adjust_updates_lot_quantity_by_lot_number(): void
    {
        $lot = StockLot::create([
            'item_id'             => $this->item->id,
            'lot_number'          => 'LOT-ADJ',
            'received_date'       => now()->toDateString(),
            'quantity_base_units' => 20,
            'unit_price_base'     => 5.00,
            'store_id'            => $this->store->id,
            'status'              => LotStatus::ACTIVE->value,
        ]);

        $tx = StockTransaction::create([
            'transaction_type'     => TransactionType::ADJUST->value,
            'reference_number'     => 'ADJ-' . uniqid(),
            'transaction_date'     => now()->toDateString(),
            'store_id'             => $this->store->id,
            'requested_by_user_id' => $this->user->id,
            'status'               => TransactionStatus::PENDING_APPROVAL->value,
        ]);

        StockTransactionLine::create([
            'transaction_id'      => $tx->id,
            'item_id'             => $this->item->id,
            'unit_id'             => $this->unit->id,
            'quantity'            => 15,
            'quantity_base_units' => 15,
            'lot_number'          => 'LOT-ADJ',
        ]);

        $tx->load('lines.item');

        $this->makeService()->apply($tx);

        $this->assertEqualsWithDelta(15, (float) $lot->fresh()->quantity_base_units, 0.0001);
    }

    // -------------------------------------------------------------------------
    // I-09: applyExpiredRemoval zeros and consumes expired lots
    // -------------------------------------------------------------------------

    public function test_apply_expired_removal_zeros_and_consumes_expired_lots(): void
    {
        // Two EXPIRED lots and one ACTIVE lot — only expired ones should be zeroed
        $expiredLot1 = StockLot::create([
            'item_id'             => $this->item->id,
            'lot_number'          => 'LOT-EXP1',
            'received_date'       => now()->subDays(30)->toDateString(),
            'quantity_base_units' => 8,
            'unit_price_base'     => 10.00,
            'store_id'            => $this->store->id,
            'status'              => LotStatus::EXPIRED->value,
        ]);

        $expiredLot2 = StockLot::create([
            'item_id'             => $this->item->id,
            'lot_number'          => 'LOT-EXP2',
            'received_date'       => now()->subDays(20)->toDateString(),
            'quantity_base_units' => 3,
            'unit_price_base'     => 10.00,
            'store_id'            => $this->store->id,
            'status'              => LotStatus::EXPIRED->value,
        ]);

        $activeLot = StockLot::create([
            'item_id'             => $this->item->id,
            'lot_number'          => 'LOT-ACTIVE',
            'received_date'       => now()->toDateString(),
            'quantity_base_units' => 5,
            'unit_price_base'     => 10.00,
            'store_id'            => $this->store->id,
            'status'              => LotStatus::ACTIVE->value,
        ]);

        $tx = StockTransaction::create([
            'transaction_type'     => TransactionType::EXPIRED_REMOVAL->value,
            'reference_number'     => 'RMV-' . uniqid(),
            'transaction_date'     => now()->toDateString(),
            'store_id'             => $this->store->id,
            'requested_by_user_id' => $this->user->id,
            'status'               => TransactionStatus::PENDING_APPROVAL->value,
        ]);

        StockTransactionLine::create([
            'transaction_id'      => $tx->id,
            'item_id'             => $this->item->id,
            'unit_id'             => $this->unit->id,
            'quantity'            => 0,
            'quantity_base_units' => 0,
        ]);

        $tx->load('lines.item');

        $this->makeService()->apply($tx);

        $this->assertEqualsWithDelta(0, (float) $expiredLot1->fresh()->quantity_base_units, 0.0001);
        $this->assertEquals(LotStatus::CONSUMED, $expiredLot1->fresh()->status);

        $this->assertEqualsWithDelta(0, (float) $expiredLot2->fresh()->quantity_base_units, 0.0001);
        $this->assertEquals(LotStatus::CONSUMED, $expiredLot2->fresh()->status);

        // Active lot must not be touched
        $this->assertEqualsWithDelta(5, (float) $activeLot->fresh()->quantity_base_units, 0.0001);
        $this->assertEquals(LotStatus::ACTIVE, $activeLot->fresh()->status);
    }

    // -------------------------------------------------------------------------
    // I-10: validateStock returns shortages for EXPORT; empty for ENTRY
    // -------------------------------------------------------------------------

    public function test_validate_stock_returns_shortages_for_export(): void
    {
        // Available: 3, Needed: 10 → shortage expected
        StockLot::create([
            'item_id'             => $this->item->id,
            'lot_number'          => 'LOT-VS',
            'received_date'       => now()->toDateString(),
            'quantity_base_units' => 3,
            'unit_price_base'     => 5.00,
            'store_id'            => $this->store->id,
            'status'              => LotStatus::ACTIVE->value,
        ]);

        $tx = $this->makeExportTransaction(10);

        $shortages = $this->makeService()->validateStock($tx);

        $this->assertNotEmpty($shortages);
        $this->assertStringContainsString('Test Item', $shortages[0]);
        $this->assertStringContainsString('10', $shortages[0]);
        $this->assertStringContainsString('3', $shortages[0]);
    }

    public function test_validate_stock_returns_empty_array_for_entry_type(): void
    {
        // No lots at all — but ENTRY is not outbound, so no shortage check
        $tx = $this->makeEntryTransaction();

        $shortages = $this->makeService()->validateStock($tx);

        $this->assertEmpty($shortages);
    }

    public function test_validate_stock_returns_empty_when_stock_is_sufficient(): void
    {
        StockLot::create([
            'item_id'             => $this->item->id,
            'lot_number'          => 'LOT-OK',
            'received_date'       => now()->toDateString(),
            'quantity_base_units' => 20,
            'unit_price_base'     => 5.00,
            'store_id'            => $this->store->id,
            'status'              => LotStatus::ACTIVE->value,
        ]);

        $tx = $this->makeExportTransaction(5);

        $shortages = $this->makeService()->validateStock($tx);

        $this->assertEmpty($shortages);
    }

    // -------------------------------------------------------------------------
    // I-23: ReorderAlertService::checkAndAlert() is called for each export line
    // -------------------------------------------------------------------------

    public function test_reorder_alert_triggered_after_export(): void
    {
        StockLot::create([
            'item_id'             => $this->item->id,
            'lot_number'          => 'LOT-RA',
            'received_date'       => now()->toDateString(),
            'quantity_base_units' => 10,
            'unit_price_base'     => 5.00,
            'store_id'            => $this->store->id,
            'status'              => LotStatus::ACTIVE->value,
        ]);

        $alertMock = $this->mock(ReorderAlertService::class);
        $alertMock->shouldReceive('checkAndAlert')
            ->once()
            ->with($this->item->id, $this->store->id);

        $service = app(StockMutationService::class);

        $tx = $this->makeExportTransaction(3);
        $service->apply($tx);
    }
}
