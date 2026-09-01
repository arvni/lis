<?php

declare(strict_types=1);

namespace Tests\Feature\Inventory;

use App\Domains\Inventory\DTOs\RelocateStockDTO;
use App\Domains\Inventory\Enums\LotStatus;
use App\Domains\Inventory\Enums\TransactionStatus;
use App\Domains\Inventory\Enums\TransactionType;
use App\Domains\Inventory\Models\Item;
use App\Domains\Inventory\Models\StockLot;
use App\Domains\Inventory\Models\StockTransaction;
use App\Domains\Inventory\Models\StockTransactionLine;
use App\Domains\Inventory\Models\Store;
use App\Domains\Inventory\Models\Unit;
use App\Domains\Inventory\Repositories\StockLotRepository;
use App\Domains\Inventory\Services\ReorderAlertService;
use App\Domains\Inventory\Services\StockCardService;
use App\Domains\Inventory\Services\StockMutationService;
use App\Domains\Inventory\Services\StockRelocationService;
use App\Domains\Inventory\Services\StockTransactionService;
use App\Domains\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use RuntimeException;
use Tests\TestCase;

/**
 * Expired stock stays visible and stays usable-on-purpose: it shows up on the
 * stock screens as its own figure, and a transaction line only touches it when
 * the operator has ticked the expired box.
 */
class ExpiredStockTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private Store $store;

    private Store $destStore;

    private Item $item;

    private Unit $unit;

    protected function setUp(): void
    {
        parent::setUp();

        Notification::fake();

        $this->user = User::factory()->create();
        $this->actingAs($this->user);

        $this->unit = Unit::create(['name' => 'Vial', 'abbreviation' => 'vial']);
        $this->store = Store::create(['name' => 'Main Store', 'code' => 'MST', 'is_active' => true]);
        $this->destStore = Store::create(['name' => 'Annex Store', 'code' => 'ANX', 'is_active' => true]);

        $this->item = Item::create([
            'item_code' => 'I-EXP-001',
            'name' => 'Perishable Reagent',
            'department' => 'LAB',
            'material_type' => 'RGT',
            'storage_condition' => 'ROOM_TEMP',
            'default_unit_id' => $this->unit->id,
            'is_active' => true,
            'minimum_stock_level' => 5,
        ]);
    }

    private function lot(array $overrides = []): StockLot
    {
        return StockLot::create(array_merge([
            'item_id' => $this->item->id,
            'lot_number' => 'LOT-'.uniqid(),
            'received_date' => now()->subMonths(6)->toDateString(),
            'quantity_base_units' => 10,
            'unit_price_base' => 2,
            'store_id' => $this->store->id,
            'status' => LotStatus::ACTIVE->value,
        ], $overrides));
    }

    private function transaction(TransactionType $type, array $line, array $overrides = []): StockTransaction
    {
        $tx = StockTransaction::create(array_merge([
            'transaction_type' => $type->value,
            'reference_number' => $type->referencePrefix().'-'.uniqid(),
            'transaction_date' => now()->toDateString(),
            'store_id' => $this->store->id,
            'requested_by_user_id' => $this->user->id,
            'status' => TransactionStatus::PENDING_APPROVAL->value,
        ], $overrides));

        StockTransactionLine::create(array_merge([
            'transaction_id' => $tx->id,
            'item_id' => $this->item->id,
            'unit_id' => $this->unit->id,
            'quantity' => $line['quantity_base_units'],
        ], $line));

        return $tx->load('lines.item');
    }

    private function mutations(): StockMutationService
    {
        $this->mock(ReorderAlertService::class)
            ->shouldReceive('checkAndAlert')->andReturnNull();

        return app(StockMutationService::class);
    }

    // -----------------------------------------------------------------
    // Current stock
    // -----------------------------------------------------------------

    public function test_current_stock_lists_an_item_whose_only_stock_has_expired(): void
    {
        $this->lot([
            'quantity_base_units' => 40,
            'expiry_date' => now()->subDay()->toDateString(),
            'status' => LotStatus::EXPIRED->value,
        ]);

        $row = app(StockCardService::class)->getCurrentStock()->firstWhere('item.id', $this->item->id);

        $this->assertNotNull($row, 'An item holding only expired stock must still be listed.');
        $this->assertEqualsWithDelta(0.0, $row['total_base'], 0.000001);
        $this->assertEqualsWithDelta(40.0, $row['expired_base'], 0.000001);
        $this->assertTrue($row['has_expired']);
        $this->assertTrue($row['is_low_stock'], 'Expired stock must not satisfy the minimum level.');
    }

    public function test_stock_past_its_expiry_date_is_expired_even_before_the_nightly_sweep_flags_it(): void
    {
        // Still ACTIVE — the scheduled command has not run since it expired.
        $this->lot(['quantity_base_units' => 12, 'expiry_date' => now()->subDay()->toDateString()]);
        $this->lot(['quantity_base_units' => 8, 'expiry_date' => now()->addYear()->toDateString()]);

        $row = app(StockCardService::class)->getCurrentStock()->firstWhere('item.id', $this->item->id);

        $this->assertEqualsWithDelta(8.0, $row['total_base'], 0.000001);
        $this->assertEqualsWithDelta(12.0, $row['expired_base'], 0.000001);
    }

    public function test_the_stock_card_shows_expired_lots_but_totals_them_separately(): void
    {
        $this->lot(['quantity_base_units' => 8, 'expiry_date' => now()->addYear()->toDateString()]);
        $this->lot([
            'quantity_base_units' => 12,
            'expiry_date' => now()->subDay()->toDateString(),
            'status' => LotStatus::EXPIRED->value,
        ]);

        $card = app(StockCardService::class)->getStockCard($this->item->id);

        $this->assertCount(2, $card['lots']);
        $this->assertEqualsWithDelta(8.0, (float) $card['total_base'], 0.000001);
        $this->assertEqualsWithDelta(12.0, (float) $card['expired_base'], 0.000001);
    }

    // -----------------------------------------------------------------
    // Using expired stock in transactions
    // -----------------------------------------------------------------

    public function test_an_export_cannot_reach_expired_stock_unless_the_line_is_flagged(): void
    {
        $this->lot([
            'quantity_base_units' => 30,
            'expiry_date' => now()->subDay()->toDateString(),
            'status' => LotStatus::EXPIRED->value,
        ]);

        $tx = $this->transaction(TransactionType::EXPORT, ['quantity_base_units' => 10]);

        $this->assertNotEmpty(app(StockMutationService::class)->validateStock($tx));

        $this->expectException(RuntimeException::class);
        $this->mutations()->apply($tx);
    }

    public function test_a_flagged_export_draws_down_expired_stock(): void
    {
        $expiredLot = $this->lot([
            'quantity_base_units' => 30,
            'expiry_date' => now()->subDay()->toDateString(),
            'status' => LotStatus::EXPIRED->value,
        ]);

        $tx = $this->transaction(TransactionType::EXPORT, [
            'quantity_base_units' => 10,
            'is_expired' => true,
        ]);

        $this->assertSame([], app(StockMutationService::class)->validateStock($tx));

        $this->mutations()->apply($tx);

        $this->assertEqualsWithDelta(20.0, (float) $expiredLot->fresh()->quantity_base_units, 0.000001);
        $this->assertSame(LotStatus::EXPIRED, $expiredLot->fresh()->status);
    }

    public function test_a_flagged_export_burns_expired_stock_before_touching_good_stock(): void
    {
        $expiredLot = $this->lot([
            'quantity_base_units' => 6,
            'received_date' => now()->subYear()->toDateString(),
            'expiry_date' => now()->subDay()->toDateString(),
            'status' => LotStatus::EXPIRED->value,
        ]);
        $usableLot = $this->lot([
            'quantity_base_units' => 20,
            'received_date' => now()->subMonth()->toDateString(),
            'expiry_date' => now()->addYear()->toDateString(),
        ]);

        $this->mutations()->apply($this->transaction(TransactionType::EXPORT, [
            'quantity_base_units' => 10,
            'is_expired' => true,
        ]));

        $this->assertSame(LotStatus::CONSUMED, $expiredLot->fresh()->status);
        $this->assertEqualsWithDelta(16.0, (float) $usableLot->fresh()->quantity_base_units, 0.000001);
    }

    public function test_expired_removal_clears_expired_stock_without_needing_the_flag(): void
    {
        $sweptLot = $this->lot([
            'quantity_base_units' => 30,
            'expiry_date' => now()->subMonth()->toDateString(),
            'status' => LotStatus::EXPIRED->value,
        ]);
        // Past its date but not yet flagged by the nightly sweep.
        $unsweptLot = $this->lot(['quantity_base_units' => 5, 'expiry_date' => now()->subDay()->toDateString()]);
        $usableLot = $this->lot(['quantity_base_units' => 7, 'expiry_date' => now()->addYear()->toDateString()]);

        $tx = $this->transaction(TransactionType::EXPIRED_REMOVAL, ['quantity_base_units' => 30]);

        $this->assertSame([], app(StockMutationService::class)->validateStock($tx));

        $this->mutations()->apply($tx);

        $this->assertSame(LotStatus::CONSUMED, $sweptLot->fresh()->status);
        $this->assertSame(LotStatus::CONSUMED, $unsweptLot->fresh()->status);
        $this->assertEqualsWithDelta(7.0, (float) $usableLot->fresh()->quantity_base_units, 0.000001);
    }

    // -----------------------------------------------------------------
    // Returning expired goods
    // -----------------------------------------------------------------

    public function test_a_return_flagged_expired_books_the_goods_back_in_as_expired(): void
    {
        $tx = $this->transaction(TransactionType::RETURN, [
            'quantity_base_units' => 4,
            'quantity' => 4,
            'lot_number' => 'LOT-RETURNED',
            'expiry_date' => now()->subMonth()->toDateString(),
            'is_expired' => true,
        ]);

        $this->mutations()->apply($tx);

        $lot = StockLot::where('lot_number', 'LOT-RETURNED')->firstOrFail();
        $this->assertSame(LotStatus::EXPIRED, $lot->status);

        // ...and it lands in the expired column, not in usable stock.
        $row = app(StockCardService::class)->getCurrentStock()->firstWhere('item.id', $this->item->id);
        $this->assertEqualsWithDelta(0.0, $row['total_base'], 0.000001);
        $this->assertEqualsWithDelta(4.0, $row['expired_base'], 0.000001);
    }

    public function test_an_unflagged_entry_still_books_stock_in_as_usable(): void
    {
        $tx = $this->transaction(TransactionType::ENTRY, [
            'quantity_base_units' => 4,
            'quantity' => 4,
            'lot_number' => 'LOT-FRESH',
            'expiry_date' => now()->addYear()->toDateString(),
        ]);

        $this->mutations()->apply($tx);

        $this->assertSame(LotStatus::ACTIVE, StockLot::where('lot_number', 'LOT-FRESH')->firstOrFail()->status);
    }

    public function test_a_transferred_expired_lot_is_released_as_expired_on_receipt(): void
    {
        $this->lot([
            'lot_number' => 'LOT-MOVING',
            'quantity_base_units' => 10,
            'expiry_date' => now()->subDay()->toDateString(),
            'status' => LotStatus::EXPIRED->value,
        ]);

        $tx = $this->transaction(TransactionType::TRANSFER, [
            'quantity_base_units' => 10,
            'lot_number' => 'LOT-MOVING',
            'is_expired' => true,
        ], ['destination_store_id' => $this->destStore->id]);

        $this->mutations()->apply($tx);
        $tx->update(['status' => TransactionStatus::APPROVED->value]);

        app(StockTransactionService::class)->confirmTransferReceipt($tx->fresh()->load('lines'), $this->user->id);

        $moved = StockLot::where('store_id', $this->destStore->id)->firstOrFail();
        $this->assertSame(LotStatus::EXPIRED, $moved->status, 'Expired stock must not become usable by moving store.');
    }

    public function test_expired_stock_can_be_moved_and_stays_expired_at_its_new_place(): void
    {
        $lot = $this->lot([
            'lot_number' => 'LOT-SHELVED',
            'quantity_base_units' => 10,
            'expiry_date' => now()->subDay()->toDateString(),
            'status' => LotStatus::EXPIRED->value,
        ]);

        $this->mock(ReorderAlertService::class)->shouldReceive('checkAndAlert')->andReturnNull();

        $moved = app(StockRelocationService::class)->relocate(
            $lot,
            new RelocateStockDTO(quantity_base_units: 4, to_store_id: $this->destStore->id),
            $this->user->id,
        );

        $this->assertSame(LotStatus::EXPIRED, $moved->status);
        $this->assertEqualsWithDelta(6.0, (float) $lot->fresh()->quantity_base_units, 0.000001);
    }

    // -----------------------------------------------------------------
    // Lookups
    // -----------------------------------------------------------------

    public function test_lot_lookups_only_offer_expired_lots_when_asked(): void
    {
        $this->lot([
            'lot_number' => 'LOT-GOOD',
            'quantity_base_units' => 10,
            'expiry_date' => now()->addYear()->toDateString(),
        ]);
        $this->lot([
            'lot_number' => 'LOT-DEAD',
            'quantity_base_units' => 10,
            'expiry_date' => now()->subDay()->toDateString(),
            'status' => LotStatus::EXPIRED->value,
        ]);

        $lots = app(StockLotRepository::class);

        $this->assertSame(
            ['LOT-GOOD'],
            $lots->activeLotsForItem($this->item->id, $this->store->id)->pluck('lot_number')->all()
        );

        $this->assertEqualsCanonicalizing(
            ['LOT-GOOD', 'LOT-DEAD'],
            $lots->activeLotsForItem($this->item->id, $this->store->id, includeExpired: true)
                ->pluck('lot_number')->all()
        );
    }

    public function test_the_lots_endpoint_flags_expired_lots_for_the_transaction_form(): void
    {
        $this->lot([
            'lot_number' => 'LOT-GOOD',
            'quantity_base_units' => 10,
            'expiry_date' => now()->addYear()->toDateString(),
        ]);
        $this->lot([
            'lot_number' => 'LOT-DEAD',
            'quantity_base_units' => 10,
            'expiry_date' => now()->subDay()->toDateString(),
            'status' => LotStatus::EXPIRED->value,
        ]);

        $url = route('api.inventory.items.lots', $this->item->id);

        $this->getJson($url.'?store_id='.$this->store->id)
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.lot_number', 'LOT-GOOD')
            ->assertJsonPath('0.is_expired', false);

        $expired = collect($this->getJson($url.'?store_id='.$this->store->id.'&include_expired=1')
            ->assertOk()
            ->assertJsonCount(2)
            ->json())
            ->firstWhere('lot_number', 'LOT-DEAD');

        $this->assertTrue($expired['is_expired']);
    }

    public function test_the_fifo_preview_only_offers_expired_lots_when_the_line_is_flagged(): void
    {
        $this->lot([
            'lot_number' => 'LOT-DEAD',
            'quantity_base_units' => 10,
            'expiry_date' => now()->subDay()->toDateString(),
            'status' => LotStatus::EXPIRED->value,
        ]);

        $params = [
            'item_id' => $this->item->id,
            'store_id' => $this->store->id,
            'quantity_base_units' => 4,
        ];

        $this->getJson(route('api.inventory.fifo.preview', $params))
            ->assertOk()
            ->assertJsonPath('available', 0)
            ->assertJsonPath('shortfall', 4);

        $this->getJson(route('api.inventory.fifo.preview', $params + ['include_expired' => 1]))
            ->assertOk()
            ->assertJsonPath('available', 10)
            ->assertJsonPath('shortfall', 0)
            ->assertJsonPath('lots.0.lot_number', 'LOT-DEAD')
            ->assertJsonPath('lots.0.is_expired', true);
    }

    public function test_the_expiry_dashboard_still_finds_lots_the_nightly_sweep_has_flagged(): void
    {
        $this->lot([
            'lot_number' => 'LOT-SWEPT',
            'quantity_base_units' => 10,
            'expiry_date' => now()->subDay()->toDateString(),
            'status' => LotStatus::EXPIRED->value,
        ]);

        $this->assertSame(
            ['LOT-SWEPT'],
            app(StockLotRepository::class)->expired($this->store->id)->pluck('lot_number')->all()
        );
    }
}
