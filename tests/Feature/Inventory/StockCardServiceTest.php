<?php

namespace Tests\Feature\Inventory;

use App\Domains\Inventory\Enums\TransactionStatus;
use App\Domains\Inventory\Enums\TransactionType;
use App\Domains\Inventory\Models\Item;
use App\Domains\Inventory\Models\StockLot;
use App\Domains\Inventory\Models\StockTransaction;
use App\Domains\Inventory\Models\StockTransactionLine;
use App\Domains\Inventory\Models\Store;
use App\Domains\Inventory\Models\Unit;
use App\Domains\Inventory\Services\StockCardService;
use App\Domains\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Collection;
use Tests\TestCase;

class StockCardServiceTest extends TestCase
{
    use RefreshDatabase;

    private StockCardService $service;
    private Store $store;
    private Unit $unit;
    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = app(StockCardService::class);
        $this->user = User::factory()->create();
        $this->actingAs($this->user);
        $this->store = Store::create(['name' => 'Main', 'code' => 'M', 'is_active' => true]);
        $this->unit = Unit::create(['name' => 'unit', 'abbreviation' => 'u']);
    }

    private function makeItem(float $minLevel = 0): Item
    {
        return Item::create([
            'item_code'           => 'I-' . uniqid(),
            'name'                => 'Reagent',
            'department'          => 'LAB',
            'material_type'       => 'RGT',
            'storage_condition'   => 'ROOM_TEMP',
            'default_unit_id'     => $this->unit->id,
            'is_active'           => true,
            'minimum_stock_level' => $minLevel,
        ]);
    }

    private function makeTxLine(Item $item, TransactionType $type, float $qtyBase): void
    {
        $tx = StockTransaction::create([
            'transaction_type'     => $type->value,
            'reference_number'     => $type->value . '-' . uniqid(),
            'transaction_date'     => now()->toDateString(),
            'store_id'             => $this->store->id,
            'requested_by_user_id' => $this->user->id,
            'status'               => TransactionStatus::APPROVED->value,
        ]);

        StockTransactionLine::create([
            'transaction_id'      => $tx->id,
            'item_id'             => $item->id,
            'unit_id'             => $this->unit->id,
            'quantity'            => $qtyBase,
            'quantity_base_units' => $qtyBase,
        ]);
    }

    private function makeLot(Item $item, float $qty): void
    {
        StockLot::create([
            'item_id'             => $item->id,
            'store_id'            => $this->store->id,
            'status'             => 'ACTIVE',
            'quantity_base_units' => $qty,
            'lot_number'         => 'L' . uniqid(),
            'received_date'      => now()->toDateString(),
        ]);
    }

    public function test_get_stock_card_computes_running_balance(): void
    {
        $item = $this->makeItem();
        $this->makeTxLine($item, TransactionType::ENTRY, 100);
        $this->makeTxLine($item, TransactionType::EXPORT, 30);
        $this->makeLot($item, 70);

        $card = $this->service->getStockCard($item->id);

        $this->assertCount(2, $card['entries']);
        $this->assertSame('IN', $card['entries'][0]['direction']);
        $this->assertSame(100.0, $card['entries'][0]['balance_base']);
        $this->assertSame('OUT', $card['entries'][1]['direction']);
        $this->assertSame(70.0, $card['entries'][1]['balance_base']);
        $this->assertEqualsWithDelta(70.0, (float) $card['total_base'], 0.001);
    }

    public function test_get_stock_card_empty_without_approved_transactions(): void
    {
        $item = $this->makeItem();
        $card = $this->service->getStockCard($item->id);
        $this->assertSame([], $card['entries']);
    }

    public function test_get_current_stock_returns_totals_and_low_flag(): void
    {
        $low = $this->makeItem(minLevel: 50);
        $this->makeLot($low, 10); // below minimum

        $ok = $this->makeItem(minLevel: 5);
        $this->makeLot($ok, 100);

        $stock = $this->service->getCurrentStock();

        $this->assertInstanceOf(Collection::class, $stock);
        $this->assertCount(2, $stock);
        $lowRow = $stock->firstWhere('item.id', $low->id);
        $this->assertTrue($lowRow['is_low_stock']);
        $okRow = $stock->firstWhere('item.id', $ok->id);
        $this->assertFalse($okRow['is_low_stock']);
    }

    public function test_get_current_stock_filters_by_search(): void
    {
        $a = $this->makeItem();
        $a->update(['name' => 'Glucose Reagent']);
        $this->makeItem()->update(['name' => 'Sodium Reagent']);

        $stock = $this->service->getCurrentStock(null, ['search' => 'Glucose']);
        $this->assertCount(1, $stock);
        $this->assertSame($a->id, $stock->first()['item']->id);
    }

    public function test_get_current_stock_low_stock_only_filter(): void
    {
        $low = $this->makeItem(minLevel: 50);
        $this->makeLot($low, 10);
        $ok = $this->makeItem(minLevel: 5);
        $this->makeLot($ok, 100);

        $stock = $this->service->getCurrentStock(null, ['low_stock_only' => true]);

        $this->assertCount(1, $stock);
        $this->assertSame($low->id, $stock->first()['item']->id);
    }
}
