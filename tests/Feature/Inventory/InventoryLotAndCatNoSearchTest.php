<?php

declare(strict_types=1);

namespace Tests\Feature\Inventory;

use App\Domains\Inventory\Enums\TransactionStatus;
use App\Domains\Inventory\Enums\TransactionType;
use App\Domains\Inventory\Models\Item;
use App\Domains\Inventory\Models\PurchaseRequest;
use App\Domains\Inventory\Models\PurchaseRequestLine;
use App\Domains\Inventory\Models\PurchaseRequestReceipt;
use App\Domains\Inventory\Models\PurchaseRequestReceiptLine;
use App\Domains\Inventory\Models\StockLot;
use App\Domains\Inventory\Models\StockTransaction;
use App\Domains\Inventory\Models\StockTransactionLine;
use App\Domains\Inventory\Models\Store;
use App\Domains\Inventory\Models\Unit;
use App\Domains\Inventory\Services\ItemService;
use App\Domains\Inventory\Services\PurchaseRequestService;
use App\Domains\Inventory\Services\StockCardService;
use App\Domains\Inventory\Services\StockTransactionService;
use App\Domains\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Staff hold a container and read what is printed on it — a lot number or a
 * supplier catalog number. These cover finding that container from the items
 * index, the current-stock overview and the transactions list.
 */
class InventoryLotAndCatNoSearchTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private Unit $unit;

    private Store $store;

    private Store $otherStore;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->actingAs($this->user);

        $this->unit = Unit::create(['name' => 'Box', 'abbreviation' => 'box']);
        $this->store = Store::create(['name' => 'Main', 'code' => 'MAIN', 'is_active' => true]);
        $this->otherStore = Store::create(['name' => 'Annex', 'code' => 'ANX', 'is_active' => true]);
    }

    private function makeItem(string $code, string $name): Item
    {
        return Item::create([
            'item_code' => $code,
            'name' => $name,
            'department' => 'LAB',
            'material_type' => 'RGT',
            'storage_condition' => 'ROOM_TEMP',
            'default_unit_id' => $this->unit->id,
            'is_active' => true,
        ]);
    }

    private function makeLot(Item $item, string $lotNumber, ?Store $store = null): StockLot
    {
        return StockLot::create([
            'item_id' => $item->id,
            'store_id' => ($store ?? $this->store)->id,
            'lot_number' => $lotNumber,
            'status' => 'ACTIVE',
            'quantity_base_units' => 25,
            'received_date' => now()->toDateString(),
        ]);
    }

    private function makeTransaction(Item $item, array $lineAttributes = [], ?string $reference = null): StockTransaction
    {
        $tx = StockTransaction::create([
            'transaction_type' => TransactionType::ENTRY->value,
            'reference_number' => $reference ?? 'ENT-'.uniqid(),
            'transaction_date' => now()->toDateString(),
            'store_id' => $this->store->id,
            'requested_by_user_id' => $this->user->id,
            'status' => TransactionStatus::APPROVED->value,
        ]);

        StockTransactionLine::create(array_merge([
            'transaction_id' => $tx->id,
            'item_id' => $item->id,
            'unit_id' => $this->unit->id,
            'quantity' => 10,
            'quantity_base_units' => 10,
        ], $lineAttributes));

        return $tx;
    }

    /**
     * An item that has been ordered but not yet received — only the purchase
     * request line carries its catalog number at this point.
     */
    private function makePurchaseRequestLine(Item $item, string $catNo, ?string $poNumber = null): PurchaseRequestLine
    {
        $pr = PurchaseRequest::create([
            'requested_by_user_id' => $this->user->id,
            'urgency' => 'NORMAL',
            'status' => 'DRAFT',
            'po_number' => $poNumber,
        ]);

        return PurchaseRequestLine::create([
            'purchase_request_id' => $pr->id,
            'item_id' => $item->id,
            'unit_id' => $this->unit->id,
            'qty' => 4,
            'cat_no' => $catNo,
        ]);
    }

    /**
     * Books a lot number against an existing request line, the way receiving does.
     */
    private function receiveLine(PurchaseRequestLine $line, string $lotNumber): void
    {
        $receipt = PurchaseRequestReceipt::create([
            'purchase_request_id' => $line->purchase_request_id,
            'transaction_id' => $this->makeTransaction($line->item)->id,
        ]);

        PurchaseRequestReceiptLine::create([
            'receipt_id' => $receipt->id,
            'pr_line_id' => $line->id,
            'qty_received' => 1,
            'lot_number' => $lotNumber,
        ]);
    }

    /** @return array<int, int> matched item ids */
    private function itemIndexSearch(string $term): array
    {
        return app(ItemService::class)
            ->listItems(['filters' => ['search' => $term]])
            ->pluck('id')
            ->all();
    }

    /** @return array<int, int> matched item ids */
    private function currentStockSearch(string $term, ?int $storeId = null): array
    {
        return app(StockCardService::class)
            ->getCurrentStock($storeId, ['search' => $term])
            ->map(fn (array $row) => $row['item']->id)
            ->all();
    }

    /** @return array<int, int> matched transaction ids */
    private function transactionSearch(string $term): array
    {
        return app(StockTransactionService::class)
            ->listTransactions(['filters' => ['search' => $term]])
            ->pluck('id')
            ->all();
    }

    /** @return array<int, int> matched purchase request ids */
    private function purchaseRequestSearch(string $term, array $extraFilters = []): array
    {
        return app(PurchaseRequestService::class)
            ->listRequests(['filters' => array_merge(['search' => $term], $extraFilters)])
            ->pluck('id')
            ->all();
    }

    // ---------------------------------------------------------------------
    // Items index
    // ---------------------------------------------------------------------

    public function test_items_index_finds_item_by_lot_number(): void
    {
        $match = $this->makeItem('I-100', 'Glucose Reagent');
        $other = $this->makeItem('I-200', 'Sodium Reagent');
        $this->makeLot($match, 'LOT-ABC-77');
        $this->makeLot($other, 'LOT-XYZ-99');

        $this->assertSame([$match->id], $this->itemIndexSearch('ABC-77'));
    }

    public function test_items_index_finds_item_by_catalog_number(): void
    {
        $match = $this->makeItem('I-100', 'Glucose Reagent');
        $other = $this->makeItem('I-200', 'Sodium Reagent');
        $this->makeTransaction($match, ['cat_no' => 'CAT-556677']);
        $this->makeTransaction($other, ['cat_no' => 'CAT-000111']);

        $this->assertSame([$match->id], $this->itemIndexSearch('556677'));
    }

    public function test_items_index_finds_item_by_catalog_number_on_a_purchase_request_line(): void
    {
        $match = $this->makeItem('I-100', 'Glucose Reagent');
        $other = $this->makeItem('I-200', 'Sodium Reagent');
        $this->makePurchaseRequestLine($match, 'CAT-889900');
        $this->makePurchaseRequestLine($other, 'CAT-111222');

        $this->assertSame([$match->id], $this->itemIndexSearch('889900'));
    }

    public function test_items_index_still_matches_item_code_and_name(): void
    {
        $byCode = $this->makeItem('I-100', 'Glucose Reagent');
        $byName = $this->makeItem('I-200', 'Sodium Chloride');

        $this->assertSame([$byCode->id], $this->itemIndexSearch('I-100'));
        $this->assertSame([$byName->id], $this->itemIndexSearch('Chloride'));
    }

    public function test_items_index_returns_each_item_once_for_multiple_matching_lots(): void
    {
        $item = $this->makeItem('I-100', 'Glucose Reagent');
        $this->makeLot($item, 'LOT-DUP-1');
        $this->makeLot($item, 'LOT-DUP-2');

        $this->assertSame([$item->id], $this->itemIndexSearch('LOT-DUP'));
    }

    // ---------------------------------------------------------------------
    // Current stock overview
    // ---------------------------------------------------------------------

    public function test_current_stock_finds_item_by_lot_number(): void
    {
        $match = $this->makeItem('I-100', 'Glucose Reagent');
        $other = $this->makeItem('I-200', 'Sodium Reagent');
        $this->makeLot($match, 'LOT-ABC-77');
        $this->makeLot($other, 'LOT-XYZ-99');

        $this->assertSame([$match->id], $this->currentStockSearch('ABC-77'));
    }

    public function test_current_stock_finds_item_by_catalog_number(): void
    {
        $match = $this->makeItem('I-100', 'Glucose Reagent');
        $this->makeItem('I-200', 'Sodium Reagent');
        $this->makeTransaction($match, ['cat_no' => 'CAT-556677']);

        $this->assertSame([$match->id], $this->currentStockSearch('556677'));
    }

    public function test_current_stock_finds_item_by_catalog_number_on_a_purchase_request_line(): void
    {
        $match = $this->makeItem('I-100', 'Glucose Reagent');
        $this->makeItem('I-200', 'Sodium Reagent');
        $this->makePurchaseRequestLine($match, 'CAT-889900');

        $this->assertSame([$match->id], $this->currentStockSearch('889900'));
    }

    public function test_current_stock_lot_search_respects_the_selected_store(): void
    {
        $item = $this->makeItem('I-100', 'Glucose Reagent');
        $this->makeLot($item, 'LOT-ANNEX-1', $this->otherStore);

        $this->assertSame([], $this->currentStockSearch('LOT-ANNEX-1', $this->store->id));
        $this->assertSame([$item->id], $this->currentStockSearch('LOT-ANNEX-1', $this->otherStore->id));
    }

    // ---------------------------------------------------------------------
    // Transactions list
    // ---------------------------------------------------------------------

    public function test_transactions_index_finds_transaction_by_lot_number(): void
    {
        $item = $this->makeItem('I-100', 'Glucose Reagent');
        $match = $this->makeTransaction($item, ['lot_number' => 'LOT-ABC-77']);
        $this->makeTransaction($item, ['lot_number' => 'LOT-XYZ-99']);

        $this->assertSame([$match->id], $this->transactionSearch('ABC-77'));
    }

    public function test_transactions_index_finds_transaction_by_catalog_number(): void
    {
        $item = $this->makeItem('I-100', 'Glucose Reagent');
        $match = $this->makeTransaction($item, ['cat_no' => 'CAT-556677']);
        $this->makeTransaction($item, ['cat_no' => 'CAT-000111']);

        $this->assertSame([$match->id], $this->transactionSearch('556677'));
    }

    public function test_transactions_index_finds_transaction_by_reference_and_item(): void
    {
        $item = $this->makeItem('I-100', 'Glucose Reagent');
        $other = $this->makeItem('I-200', 'Sodium Reagent');
        $match = $this->makeTransaction($item, [], 'ENT-2026-0042');
        $this->makeTransaction($other, [], 'ENT-2026-0043');

        $this->assertSame([$match->id], $this->transactionSearch('0042'));
        $this->assertSame([$match->id], $this->transactionSearch('Glucose'));
    }

    public function test_transactions_index_search_combines_with_other_filters(): void
    {
        $item = $this->makeItem('I-100', 'Glucose Reagent');
        $this->makeTransaction($item, ['lot_number' => 'LOT-ABC-77']);

        $results = app(StockTransactionService::class)->listTransactions([
            'filters' => ['search' => 'ABC-77', 'status' => TransactionStatus::DRAFT->value],
        ]);

        $this->assertCount(0, $results);
    }

    // ---------------------------------------------------------------------
    // Purchase requests list
    // ---------------------------------------------------------------------

    public function test_purchase_requests_index_finds_request_by_catalog_number(): void
    {
        $item = $this->makeItem('I-100', 'Glucose Reagent');
        $match = $this->makePurchaseRequestLine($item, 'CAT-889900');
        $this->makePurchaseRequestLine($item, 'CAT-111222');

        $this->assertSame([$match->purchase_request_id], $this->purchaseRequestSearch('889900'));
    }

    public function test_purchase_requests_index_finds_request_by_po_number(): void
    {
        $item = $this->makeItem('I-100', 'Glucose Reagent');
        $match = $this->makePurchaseRequestLine($item, 'CAT-889900', 'PO-2026-0042');
        $this->makePurchaseRequestLine($item, 'CAT-111222', 'PO-2026-0043');

        $this->assertSame([$match->purchase_request_id], $this->purchaseRequestSearch('0042'));
    }

    public function test_purchase_requests_index_finds_request_by_item_code_and_name(): void
    {
        $glucose = $this->makeItem('I-100', 'Glucose Reagent');
        $sodium = $this->makeItem('I-200', 'Sodium Chloride');
        $match = $this->makePurchaseRequestLine($glucose, 'CAT-889900');
        $this->makePurchaseRequestLine($sodium, 'CAT-111222');

        $this->assertSame([$match->purchase_request_id], $this->purchaseRequestSearch('I-100'));
        $this->assertSame([$match->purchase_request_id], $this->purchaseRequestSearch('Glucose'));
    }

    public function test_purchase_requests_index_finds_request_by_received_lot_number(): void
    {
        $item = $this->makeItem('I-100', 'Glucose Reagent');
        $match = $this->makePurchaseRequestLine($item, 'CAT-889900');
        $this->makePurchaseRequestLine($item, 'CAT-111222');
        $this->receiveLine($match, 'LOT-ABC-77');

        $this->assertSame([$match->purchase_request_id], $this->purchaseRequestSearch('ABC-77'));
    }

    public function test_purchase_requests_index_search_combines_with_other_filters(): void
    {
        $item = $this->makeItem('I-100', 'Glucose Reagent');
        $this->makePurchaseRequestLine($item, 'CAT-889900');

        $this->assertSame([], $this->purchaseRequestSearch('889900', ['status' => 'RECEIVED']));
    }

    public function test_purchase_requests_index_search_stays_inside_the_current_view(): void
    {
        $item = $this->makeItem('I-100', 'Glucose Reagent');
        $mine = $this->makePurchaseRequestLine($item, 'CAT-889900');

        // Someone else's request carrying the same catalog number must not leak
        // into the default 'mine' view just because it matches the search.
        $theirs = PurchaseRequest::create([
            'requested_by_user_id' => User::factory()->create()->id,
            'urgency' => 'NORMAL',
            'status' => 'DRAFT',
        ]);
        PurchaseRequestLine::create([
            'purchase_request_id' => $theirs->id,
            'item_id' => $item->id,
            'unit_id' => $this->unit->id,
            'qty' => 4,
            'cat_no' => 'CAT-889900',
        ]);

        $this->assertSame([$mine->purchase_request_id], $this->purchaseRequestSearch('889900'));
    }
}
