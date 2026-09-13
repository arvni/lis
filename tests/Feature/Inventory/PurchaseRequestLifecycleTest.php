<?php

declare(strict_types=1);

namespace Tests\Feature\Inventory;

use App\Domains\Inventory\Enums\ApprovalStatus;
use App\Domains\Inventory\Enums\PurchaseRequestStatus;
use App\Domains\Inventory\Enums\WorkflowRequestType;
use App\Domains\Inventory\Models\Item;
use App\Domains\Inventory\Models\PurchaseRequest;
use App\Domains\Inventory\Models\StockLot;
use App\Domains\Inventory\Models\StockTransaction;
use App\Domains\Inventory\Models\Store;
use App\Domains\Inventory\Models\Supplier;
use App\Domains\Inventory\Models\Unit;
use App\Domains\Inventory\Models\WorkflowStep;
use App\Domains\Inventory\Models\WorkflowTemplate;
use App\Domains\Inventory\Notifications\PurchaseRequestApprovedNotification;
use App\Domains\Inventory\Notifications\PurchaseRequestRejectedNotification;
use App\Domains\Inventory\Notifications\PurchaseRequestStepPendingNotification;
use App\Domains\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Testing\TestResponse;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

/**
 * The whole purchase request process, end to end through the HTTP endpoints, with
 * a different person at each stage:
 *
 *   create (DRAFT) → submit → workflow approval → issue PO → record payment (optional)
 *   → mark shipped → receive (possibly in parts) → RECEIVED, with the stock booked.
 *
 * Along the way it checks that the wrong person, or the wrong moment, is refused.
 */
class PurchaseRequestLifecycleTest extends TestCase
{
    use RefreshDatabase;

    private User $requester;

    private User $labManager;

    private User $financeHead;

    private User $purchaser;

    private User $storeKeeper;

    private Unit $vial;

    private Unit $box;

    private Item $taq;

    private Item $tips;

    private Store $store;

    private Supplier $supplier;

    protected function setUp(): void
    {
        parent::setUp();
        Notification::fake();

        $this->requester = $this->makeUser('Requester', ['List Purchase Requests', 'Create Purchase Request']);
        $this->labManager = $this->makeUser('Lab Manager', ['List Purchase Requests'], ['Lab Manager']);
        $this->financeHead = $this->makeUser('Finance Head', ['List Purchase Requests']);
        $this->purchaser = $this->makeUser('Purchaser', [
            'List Purchase Requests', 'Order Purchase Request', 'Pay Purchase Request', 'Ship Purchase Request',
        ]);
        // Receiving is gated on the create ability.
        $this->storeKeeper = $this->makeUser('Store Keeper', ['List Purchase Requests', 'Create Purchase Request']);

        $this->vial = Unit::create(['name' => 'Vial', 'abbreviation' => 'vial']);
        $this->box = Unit::create(['name' => 'Box', 'abbreviation' => 'bx']);
        $this->taq = $this->makeItem('TAQ-500', 'Taq Polymerase', $this->vial);
        $this->tips = $this->makeItem('TIPS-200', 'Pipette Tips 200µl', $this->box);
        $this->store = Store::create(['name' => 'Main Store', 'code' => 'MST', 'is_active' => true]);
        $this->supplier = Supplier::create(['name' => 'Lab Supplies Co', 'code' => 'LSC', 'is_active' => true]);
    }

    // -------------------------------------------------------------------------
    // Scenarios
    // -------------------------------------------------------------------------

    public function test_full_process_through_a_two_step_workflow_with_payment_and_split_delivery(): void
    {
        $this->twoStepWorkflow();

        // 1. Create: one catalogue item and one item that isn't in the catalogue yet.
        $pr = $this->createRequest($this->requester, [
            ['item_id' => $this->taq->id, 'unit_id' => $this->vial->id, 'qty' => 10, 'estimated_unit_price' => 45],
            ['item_name' => 'Filter tips 200µl, sterile', 'unit_id' => $this->box->id, 'qty' => 5, 'estimated_unit_price' => 12],
        ]);
        $this->assertSame(PurchaseRequestStatus::DRAFT, $pr->status);
        $this->assertNotNull($pr->workflow_template_id, 'the default purchase workflow is matched');

        // 2. Submit: the first step's approvers are notified.
        $this->act($this->requester)->put(route('inventory.purchase-requests.update', $pr), ['action' => 'submit'])
            ->assertSessionHas('success', true);
        $this->assertStatus($pr, PurchaseRequestStatus::SUBMITTED);
        Notification::assertSentTo($this->labManager, PurchaseRequestStepPendingNotification::class);

        // Nobody can order before approval, and only the active step's approver may act.
        $this->act($this->purchaser)->post(route('inventory.purchase-requests.order', $pr), $this->orderPayload())
            ->assertSessionHas('success', false);
        $this->act($this->requester)->post(route('inventory.purchase-requests.approve-step', $pr))->assertForbidden();
        $this->act($this->financeHead)->post(route('inventory.purchase-requests.approve-step', $pr))->assertForbidden();
        $this->assertShowPageLetsAct($this->labManager, $pr, true);
        $this->assertShowPageLetsAct($this->requester, $pr, false);

        // 3. Workflow: step 1 (by role), then step 2 (by named user) → APPROVED.
        $this->act($this->labManager)
            ->post(route('inventory.purchase-requests.approve-step', $pr), ['notes' => 'Needed for the PCR run'])
            ->assertSessionHas('success', true);
        $this->assertStatus($pr, PurchaseRequestStatus::SUBMITTED);
        Notification::assertSentTo($this->financeHead, PurchaseRequestStepPendingNotification::class);

        $this->act($this->financeHead)->post(route('inventory.purchase-requests.approve-step', $pr))
            ->assertSessionHas('success', true);
        $this->assertStatus($pr, PurchaseRequestStatus::APPROVED);
        $this->assertSame(2, $pr->approvals()->where('status', ApprovalStatus::APPROVED)->count());
        $this->assertSame($this->financeHead->id, $pr->fresh()->approved_by_user_id);
        Notification::assertSentTo($this->requester, PurchaseRequestApprovedNotification::class);

        // 4. Issue PO — the requester has no ordering permission.
        $this->act($this->requester)->post(route('inventory.purchase-requests.order', $pr), $this->orderPayload())
            ->assertForbidden();
        $this->act($this->purchaser)->post(route('inventory.purchase-requests.order', $pr), $this->orderPayload())
            ->assertSessionHas('success', true);
        $this->assertStatus($pr, PurchaseRequestStatus::ORDERED);

        // 5. Record payment.
        $this->act($this->purchaser)->post(route('inventory.purchase-requests.pay', $pr), [
            'payment_date' => '2026-09-10',
            'payment_reference' => 'BANK-778',
        ])->assertSessionHas('success', true);
        $this->assertStatus($pr, PurchaseRequestStatus::PAID);

        // Goods can't be received before they are shipped.
        $this->act($this->storeKeeper)->get(route('inventory.purchase-requests.receive', $pr))->assertForbidden();

        // 6. Mark shipped.
        $this->act($this->purchaser)->post(route('inventory.purchase-requests.ship', $pr), [
            'shipment_date' => '2026-09-11',
            'tracking_number' => 'DHL-123456',
            'expected_delivery_date' => '2026-09-15',
        ])->assertSessionHas('success', true);
        $this->assertStatus($pr, PurchaseRequestStatus::SHIPPED);
        $this->act($this->storeKeeper)->get(route('inventory.purchase-requests.receive', $pr))->assertOk();

        [$taqLine, $tipsLine] = $pr->lines()->orderBy('id')->get()->all();

        // 7a. First delivery: part of each line. The typed-name line must be linked
        //     to a catalogue item before it can go into stock.
        $this->receive($pr, [
            ['pr_line_id' => $taqLine->id, 'qty' => 4, 'lot_number' => 'TAQ-LOT-A'],
            ['pr_line_id' => $tipsLine->id, 'qty' => 2, 'lot_number' => 'TIPS-LOT-A'],
        ])->assertSessionHas('success', false);
        $this->assertStatus($pr, PurchaseRequestStatus::SHIPPED);

        $this->receive($pr, [
            ['pr_line_id' => $taqLine->id, 'qty' => 4, 'lot_number' => 'TAQ-LOT-A'],
            ['pr_line_id' => $tipsLine->id, 'qty' => 2, 'lot_number' => 'TIPS-LOT-A',
                'item_id' => $this->tips->id, 'unit_id' => $this->box->id],
        ])->assertSessionHas('success', true);
        $this->assertStatus($pr, PurchaseRequestStatus::PARTIALLY_RECEIVED);
        $this->assertSame($this->tips->id, $tipsLine->fresh()->item_id, 'the typed-name line is now linked');
        $this->assertSame('Filter tips 200µl, sterile', $tipsLine->fresh()->item_name, 'and keeps what was asked for');

        // 7b. Second delivery: the rest. The linked line needs no item any more.
        $this->receive($pr, [
            ['pr_line_id' => $taqLine->id, 'qty' => 6, 'lot_number' => 'TAQ-LOT-B'],
            ['pr_line_id' => $tipsLine->id, 'qty' => 3, 'lot_number' => 'TIPS-LOT-B'],
        ])->assertSessionHas('success', true);
        $this->assertStatus($pr, PurchaseRequestStatus::RECEIVED);

        // Everything ordered is in stock, against the right items, in the receiving store.
        $this->assertStockInStore($this->taq, 10);
        $this->assertStockInStore($this->tips, 5);
        $this->assertSame(2, StockTransaction::where('transaction_type', 'ENTRY')->where('status', 'APPROVED')->count());
        $this->assertEqualsWithDelta(10, (float) $taqLine->fresh()->qty_received, 0.001);
        $this->assertEqualsWithDelta(5, (float) $tipsLine->fresh()->qty_received, 0.001);

        $pr->refresh();
        $this->assertSame('PO-2026-0042', $pr->po_number);
        $this->assertSame($this->supplier->id, $pr->supplier_id);
        $this->assertSame('BANK-778', $pr->payment_reference);
        $this->assertSame('DHL-123456', $pr->tracking_number);
        $this->assertSame([
            'CREATED', 'SUBMITTED', 'STEP_APPROVED', 'STEP_APPROVED', 'APPROVED',
            'ORDERED', 'PAID', 'SHIPPED', 'RECEIVED_PARTIAL', 'RECEIVED',
        ], $this->historyOf($pr));

        // A fully received request is closed.
        $this->act($this->requester)->post(route('inventory.purchase-requests.cancel', $pr))
            ->assertSessionHas('success', false);
        $this->assertStatus($pr, PurchaseRequestStatus::RECEIVED);
    }

    public function test_process_without_a_workflow_is_approved_directly_and_can_ship_without_payment(): void
    {
        $approver = $this->makeUser('Approver', ['List Purchase Requests', 'Approve Purchase Request']);
        // Holding the approve permission doesn't let the requester approve their own request.
        $this->grant($this->requester, 'Approve Purchase Request');

        $pr = $this->createRequest($this->requester, [
            ['item_id' => $this->taq->id, 'unit_id' => $this->vial->id, 'qty' => 3],
        ]);
        $this->assertNull($pr->workflow_template_id, 'no workflow template exists');

        $this->act($this->requester)->put(route('inventory.purchase-requests.update', $pr), ['action' => 'submit'])
            ->assertSessionHas('success', true);

        $this->act($this->requester)->put(route('inventory.purchase-requests.update', $pr), ['action' => 'approve'])
            ->assertSessionHas('success', false);
        $this->assertStatus($pr, PurchaseRequestStatus::SUBMITTED);

        $this->act($approver)->put(route('inventory.purchase-requests.update', $pr), ['action' => 'approve'])
            ->assertSessionHas('success', true);
        $this->assertStatus($pr, PurchaseRequestStatus::APPROVED);

        $this->act($this->purchaser)->post(route('inventory.purchase-requests.order', $pr), $this->orderPayload())
            ->assertSessionHas('success', true);

        // Payment is optional: ship straight from ORDERED…
        $this->act($this->purchaser)->post(route('inventory.purchase-requests.ship', $pr), ['tracking_number' => 'ARAMEX-9'])
            ->assertSessionHas('success', true);
        $this->assertStatus($pr, PurchaseRequestStatus::SHIPPED);

        // …but once shipped, a payment can no longer be recorded.
        $this->act($this->purchaser)->post(route('inventory.purchase-requests.pay', $pr), ['payment_date' => '2026-09-12'])
            ->assertSessionHas('success', false);
        $this->assertNull($pr->fresh()->payment_date);

        $line = $pr->lines()->sole();
        $this->receive($pr, [['pr_line_id' => $line->id, 'qty' => 3, 'lot_number' => 'TAQ-LOT-C']])
            ->assertSessionHas('success', true);

        $this->assertStatus($pr, PurchaseRequestStatus::RECEIVED);
        $this->assertStockInStore($this->taq, 3);
        $this->assertSame(
            ['CREATED', 'SUBMITTED', 'APPROVED', 'ORDERED', 'SHIPPED', 'RECEIVED'],
            $this->historyOf($pr),
        );
    }

    public function test_a_rejected_request_is_edited_resubmitted_and_approved(): void
    {
        $template = WorkflowTemplate::create([
            'name' => 'Manager sign-off',
            'is_active' => true,
            'is_default' => true,
            'request_type' => WorkflowRequestType::PURCHASE,
        ]);
        WorkflowStep::create([
            'workflow_template_id' => $template->id,
            'name' => 'Lab manager',
            'sort_order' => 1,
            'approver_role' => 'Lab Manager',
        ]);

        $pr = $this->createRequest($this->requester, [
            ['item_id' => $this->taq->id, 'unit_id' => $this->vial->id, 'qty' => 50],
        ]);
        $this->act($this->requester)->put(route('inventory.purchase-requests.update', $pr), ['action' => 'submit']);

        // Rejected: back to DRAFT, the requester is told why.
        $this->act($this->labManager)
            ->post(route('inventory.purchase-requests.reject-step', $pr), ['notes' => '50 vials is too many — order 20'])
            ->assertSessionHas('success', true);
        $this->assertStatus($pr, PurchaseRequestStatus::DRAFT);
        $this->assertSame(1, $pr->approvals()->where('status', ApprovalStatus::REJECTED)->count());
        Notification::assertSentTo($this->requester, PurchaseRequestRejectedNotification::class);

        // The requester fixes the quantity and resubmits with a note on what changed.
        $this->act($this->requester)->put(route('inventory.purchase-requests.update', $pr), [
            'urgency' => 'NORMAL',
            'lines' => [['item_id' => $this->taq->id, 'unit_id' => $this->vial->id, 'qty' => 20]],
        ])->assertSessionHasNoErrors();
        $this->assertEqualsWithDelta(20, (float) $pr->lines()->sole()->qty, 0.001);

        $this->act($this->requester)->put(route('inventory.purchase-requests.update', $pr), [
            'action' => 'submit',
            'change_notes' => 'Reduced to 20 vials',
        ])->assertSessionHas('success', true);
        $this->assertStatus($pr, PurchaseRequestStatus::SUBMITTED);
        $this->assertSame(1, $pr->approvals()->where('status', ApprovalStatus::PENDING)->count(), 'the workflow starts over');
        $this->assertDatabaseHas('purchase_request_histories', [
            'purchase_request_id' => $pr->id,
            'event' => 'RESUBMITTED',
            'change_notes' => 'Reduced to 20 vials',
        ]);

        $this->act($this->labManager)->post(route('inventory.purchase-requests.approve-step', $pr))
            ->assertSessionHas('success', true);
        $this->assertStatus($pr, PurchaseRequestStatus::APPROVED);
        $this->assertSame(
            ['CREATED', 'SUBMITTED', 'REJECTED', 'RESUBMITTED', 'STEP_APPROVED', 'APPROVED'],
            $this->historyOf($pr),
        );
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /**
     * @param  list<string>  $permissions  names under "Inventory.PurchaseRequests."
     * @param  list<string>  $roles
     */
    private function makeUser(string $name, array $permissions = [], array $roles = []): User
    {
        $user = User::factory()->create(['name' => $name]);
        foreach ($permissions as $permission) {
            $this->grant($user, $permission);
        }
        foreach ($roles as $role) {
            Role::findOrCreate($role, 'web');
            $user->assignRole($role);
        }
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return $user;
    }

    private function grant(User $user, string $permission): void
    {
        $name = "Inventory.PurchaseRequests.{$permission}";
        Permission::findOrCreate($name, 'web');
        $user->givePermissionTo($name);
        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    private function makeItem(string $code, string $name, Unit $unit): Item
    {
        return Item::create([
            'item_code' => $code,
            'name' => $name,
            'department' => 'LAB',
            'material_type' => 'RGT',
            'storage_condition' => 'ROOM_TEMP',
            'default_unit_id' => $unit->id,
            'is_active' => true,
        ]);
    }

    /** Step 1 by the "Lab Manager" role, step 2 by the finance head in person. */
    private function twoStepWorkflow(): void
    {
        $template = WorkflowTemplate::create([
            'name' => 'Purchase approval',
            'is_active' => true,
            'is_default' => true,
            'request_type' => WorkflowRequestType::PURCHASE,
        ]);
        WorkflowStep::create([
            'workflow_template_id' => $template->id,
            'name' => 'Lab manager review',
            'sort_order' => 1,
            'approver_role' => 'Lab Manager',
        ]);
        WorkflowStep::create([
            'workflow_template_id' => $template->id,
            'name' => 'Finance sign-off',
            'sort_order' => 2,
            'approver_user_id' => $this->financeHead->id,
        ]);
    }

    /** @param  list<array<string, mixed>>  $lines */
    private function createRequest(User $user, array $lines): PurchaseRequest
    {
        $this->act($user)->post(route('inventory.purchase-requests.store'), [
            'urgency' => 'NORMAL',
            'notes' => 'Monthly molecular consumables',
            'lines' => $lines,
        ])->assertSessionHasNoErrors()->assertRedirect();

        return PurchaseRequest::latest('id')->firstOrFail();
    }

    /** @param  list<array<string, mixed>>  $lines */
    private function receive(PurchaseRequest $pr, array $lines): TestResponse
    {
        $lines = array_map(fn (array $line): array => $line + ['expiry_date' => '2027-12-31'], $lines);

        return $this->act($this->storeKeeper)->post(route('inventory.purchase-requests.store-receipt', $pr), [
            'store_id' => $this->store->id,
            'notes' => 'Delivery checked against the packing slip',
            'lines' => $lines,
        ]);
    }

    /** @return array<string, mixed> */
    private function orderPayload(): array
    {
        return ['po_number' => 'PO-2026-0042', 'supplier_id' => $this->supplier->id];
    }

    /** Each request starts from the request page, as a user would. */
    private function act(User $user): static
    {
        return $this->actingAs($user)->from(route('inventory.purchase-requests.index'));
    }

    private function assertStatus(PurchaseRequest $pr, PurchaseRequestStatus $expected): void
    {
        $this->assertSame($expected, $pr->fresh()->status);
    }

    private function assertShowPageLetsAct(User $user, PurchaseRequest $pr, bool $canAct): void
    {
        $this->act($user)->get(route('inventory.purchase-requests.show', $pr))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Inventory/PurchaseRequests/Show')
                ->where('canActOnWorkflow', $canAct));
    }

    private function assertStockInStore(Item $item, float $baseUnits): void
    {
        $this->assertEqualsWithDelta(
            $baseUnits,
            (float) StockLot::where('item_id', $item->id)->where('store_id', $this->store->id)->sum('quantity_base_units'),
            0.001,
        );
    }

    /** @return list<string> */
    private function historyOf(PurchaseRequest $pr): array
    {
        return $pr->histories()->orderBy('id')->pluck('event')->all();
    }
}
