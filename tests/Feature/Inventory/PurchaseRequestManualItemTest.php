<?php

declare(strict_types=1);

namespace Tests\Feature\Inventory;

use App\Domains\Inventory\Enums\PurchaseRequestStatus;
use App\Domains\Inventory\Models\Item;
use App\Domains\Inventory\Models\PurchaseRequest;
use App\Domains\Inventory\Models\PurchaseRequestLine;
use App\Domains\Inventory\Models\StockLot;
use App\Domains\Inventory\Models\Store;
use App\Domains\Inventory\Models\Unit;
use App\Domains\Inventory\Services\PurchaseRequestService;
use App\Domains\Inventory\Services\StockTransactionService;
use App\Domains\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use RuntimeException;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

/**
 * A purchase request line can name an item that isn't in the catalogue yet. It is
 * linked to a real item (and one of that item's units) when the goods are received,
 * because a stock entry always needs one.
 */
class PurchaseRequestManualItemTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private Unit $unit;

    private Store $store;

    private Item $item;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        Permission::findOrCreate('Inventory.PurchaseRequests.Create Purchase Request', 'web');
        $this->user->givePermissionTo('Inventory.PurchaseRequests.Create Purchase Request');
        app(PermissionRegistrar::class)->forgetCachedPermissions();
        $this->actingAs($this->user);

        $this->unit = Unit::create(['name' => 'Box', 'abbreviation' => 'bx']);
        $this->store = Store::create(['name' => 'Main Store', 'code' => 'MST', 'is_active' => true]);
        $this->item = Item::create([
            'item_code' => 'TIPS-200',
            'name' => 'Pipette Tips 200µl',
            'department' => 'LAB',
            'material_type' => 'RGT',
            'storage_condition' => 'ROOM_TEMP',
            'default_unit_id' => $this->unit->id,
            'is_active' => true,
        ]);
    }

    /** A shipped request with one line that only carries a typed name. */
    private function shippedManualLine(float $qty = 5): PurchaseRequestLine
    {
        $pr = PurchaseRequest::create([
            'requested_by_user_id' => $this->user->id,
            'urgency' => 'NORMAL',
            'status' => PurchaseRequestStatus::SHIPPED->value,
        ]);

        return $pr->lines()->create([
            'item_name' => 'Pipette tips',
            'unit_id' => $this->unit->id,
            'qty' => $qty,
        ]);
    }

    // -------------------------------------------------------------------------
    // Creating a request
    // -------------------------------------------------------------------------

    public function test_a_line_can_carry_only_a_typed_item_name(): void
    {
        $this->post(route('inventory.purchase-requests.store'), [
            'urgency' => 'NORMAL',
            'lines' => [['item_name' => 'Pipette tips', 'unit_id' => $this->unit->id, 'qty' => 5]],
        ])->assertSessionHasNoErrors()->assertRedirect();

        $line = PurchaseRequestLine::sole();
        $this->assertNull($line->item_id);
        $this->assertSame('Pipette tips', $line->item_name);
        $this->assertSame('Pipette tips', $line->displayName());
    }

    public function test_a_line_needs_an_item_or_a_typed_name(): void
    {
        $this->from(route('inventory.purchase-requests.create'))
            ->post(route('inventory.purchase-requests.store'), [
                'urgency' => 'NORMAL',
                'lines' => [['unit_id' => $this->unit->id, 'qty' => 5]],
            ])
            ->assertSessionHasErrors(['lines.0.item_id', 'lines.0.item_name']);

        $this->assertDatabaseCount('purchase_requests', 0);
    }

    public function test_a_picked_item_drops_a_leftover_typed_name(): void
    {
        $this->post(route('inventory.purchase-requests.store'), [
            'urgency' => 'NORMAL',
            'lines' => [[
                'item_id' => $this->item->id,
                'item_name' => 'stale text',
                'unit_id' => $this->unit->id,
                'qty' => 5,
            ]],
        ])->assertSessionHasNoErrors();

        $line = PurchaseRequestLine::sole();
        $this->assertSame($this->item->id, $line->item_id);
        $this->assertNull($line->item_name);
    }

    public function test_search_finds_a_request_by_its_typed_item_name(): void
    {
        $line = $this->shippedManualLine();

        $results = app(PurchaseRequestService::class)->listRequests(['filters' => ['search' => 'pipette']]);

        $this->assertSame([$line->purchase_request_id], collect($results->items())->pluck('id')->all());
    }

    // -------------------------------------------------------------------------
    // Receiving
    // -------------------------------------------------------------------------

    public function test_receiving_links_the_line_and_books_stock_against_the_item(): void
    {
        $line = $this->shippedManualLine(5);
        $pr = $line->purchaseRequest;

        app(PurchaseRequestService::class)->receiveItems($pr, [
            'store_id' => $this->store->id,
            'lines' => [[
                'pr_line_id' => $line->id,
                'qty' => 5,
                'item_id' => $this->item->id,
                'unit_id' => $this->unit->id,
                'lot_number' => 'LOT-TIPS-1',
                'expiry_date' => now()->addYear()->toDateString(),
            ]],
        ]);

        $line->refresh();
        $this->assertSame($this->item->id, $line->item_id);
        $this->assertSame('Pipette tips', $line->item_name, 'the typed name stays as a record');
        $this->assertEqualsWithDelta(5, (float) $line->qty_received, 0.001);
        $this->assertSame(PurchaseRequestStatus::RECEIVED, $pr->fresh()->status);
        $this->assertTrue(
            StockLot::where('item_id', $this->item->id)->where('store_id', $this->store->id)->exists(),
            'stock is booked against the linked item',
        );
    }

    public function test_receiving_an_unlinked_line_is_refused(): void
    {
        $line = $this->shippedManualLine();
        $this->mock(StockTransactionService::class)->shouldNotReceive('createTransaction');

        try {
            app(PurchaseRequestService::class)->receiveItems($line->purchaseRequest, [
                'store_id' => $this->store->id,
                'lines' => [['pr_line_id' => $line->id, 'qty' => 5]],
            ]);
            $this->fail('Expected an unlinked line to be refused.');
        } catch (RuntimeException $e) {
            $this->assertStringContainsString('Link "Pipette tips"', $e->getMessage());
        }

        $this->assertNull($line->fresh()->item_id);
    }

    public function test_receiving_refuses_a_unit_the_item_is_not_counted_in(): void
    {
        $line = $this->shippedManualLine();
        $litre = Unit::create(['name' => 'Litre', 'abbreviation' => 'L']);
        $this->mock(StockTransactionService::class)->shouldNotReceive('createTransaction');

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessageMatches("/isn't used by the item/");

        app(PurchaseRequestService::class)->receiveItems($line->purchaseRequest, [
            'store_id' => $this->store->id,
            'lines' => [[
                'pr_line_id' => $line->id,
                'qty' => 5,
                'item_id' => $this->item->id,
                'unit_id' => $litre->id,
            ]],
        ]);
    }

    public function test_one_line_cannot_be_linked_to_two_items_in_one_receipt(): void
    {
        $line = $this->shippedManualLine(10);
        $otherItem = Item::create([
            'item_code' => 'TIPS-1000',
            'name' => 'Pipette Tips 1000µl',
            'department' => 'LAB',
            'material_type' => 'RGT',
            'storage_condition' => 'ROOM_TEMP',
            'default_unit_id' => $this->unit->id,
            'is_active' => true,
        ]);
        $this->mock(StockTransactionService::class)->shouldNotReceive('createTransaction');

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessageMatches('/linked to different items/');

        app(PurchaseRequestService::class)->receiveItems($line->purchaseRequest, [
            'store_id' => $this->store->id,
            'lines' => [
                ['pr_line_id' => $line->id, 'qty' => 5, 'item_id' => $this->item->id, 'unit_id' => $this->unit->id],
                ['pr_line_id' => $line->id, 'qty' => 5, 'item_id' => $otherItem->id, 'unit_id' => $this->unit->id],
            ],
        ]);
    }
}
