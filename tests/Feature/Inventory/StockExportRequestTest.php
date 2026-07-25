<?php

namespace Tests\Feature\Inventory;

use App\Domains\Inventory\Enums\LotStatus;
use App\Domains\Inventory\Enums\StockExportRequestStatus;
use App\Domains\Inventory\Models\Item;
use App\Domains\Inventory\Models\StockExportRequest;
use App\Domains\Inventory\Models\StockLot;
use App\Domains\Inventory\Models\Store;
use App\Domains\Inventory\Models\Unit;
use App\Domains\Inventory\Models\WorkflowStep;
use App\Domains\Inventory\Models\WorkflowTemplate;
use App\Domains\Inventory\Services\StockExportRequestService;
use App\Domains\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use RuntimeException;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class StockExportRequestTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private Store $store;

    private Item $item;

    private Unit $unit;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = $this->userWithPermissions([
            'Inventory.ExportRequests.List Export Requests',
            'Inventory.ExportRequests.Create Export Request',
            'Inventory.ExportRequests.Approve Export Request',
            'Inventory.ExportRequests.Fulfill Export Request',
        ]);
        $this->actingAs($this->user);

        $this->unit = Unit::create(['name' => 'Box', 'abbreviation' => 'box']);
        $this->store = Store::create(['name' => 'Main Store', 'code' => 'MST', 'is_active' => true]);
        $this->item = Item::create([
            'item_code' => 'I-EXP-001',
            'name' => 'Export Item',
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

    private function seedStock(float $qtyBase): StockLot
    {
        return StockLot::create([
            'item_id' => $this->item->id,
            'lot_number' => 'LOT-'.uniqid(),
            'barcode' => 'BC-'.uniqid(),
            'received_date' => now()->toDateString(),
            'quantity_base_units' => $qtyBase,
            'unit_price_base' => 2.5,
            'store_id' => $this->store->id,
            'status' => LotStatus::ACTIVE->value,
        ]);
    }

    private function storePayload(array $overrides = []): array
    {
        return array_merge([
            'store_id' => $this->store->id,
            'destination' => 'Molecular Lab',
            'urgency' => 'NORMAL',
            'lines' => [
                ['item_id' => $this->item->id, 'unit_id' => $this->unit->id, 'qty' => 3],
            ],
        ], $overrides);
    }

    // -------------------------------------------------------------------------
    // Creation + stock-cap validation
    // -------------------------------------------------------------------------

    public function test_store_creates_request_with_lines_and_logs_created(): void
    {
        $this->seedStock(10);

        $response = $this->post(route('inventory.export-requests.store'), $this->storePayload());

        $er = StockExportRequest::latest('id')->first();
        $response->assertRedirect(route('inventory.export-requests.show', $er->id));

        $this->assertSame($this->store->id, $er->store_id);
        $this->assertCount(1, $er->lines);
        $this->assertDatabaseHas('stock_export_request_histories', [
            'stock_export_request_id' => $er->id,
            'event' => 'CREATED',
        ]);
    }

    public function test_store_rejects_line_exceeding_available_stock(): void
    {
        $this->seedStock(2); // only 2 available, request 3

        $response = $this->from(route('inventory.export-requests.create'))
            ->post(route('inventory.export-requests.store'), $this->storePayload());

        $response->assertSessionHasErrors('lines.0.qty');
        $this->assertDatabaseCount('stock_export_requests', 0);
    }

    public function test_store_accepts_line_equal_to_available_stock(): void
    {
        $this->seedStock(3); // exactly 3 available, request 3

        $response = $this->post(route('inventory.export-requests.store'), $this->storePayload());

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseCount('stock_export_requests', 1);
    }

    public function test_store_requires_create_permission(): void
    {
        $this->seedStock(10);
        $this->actingAs(User::factory()->create()); // no permissions

        $this->post(route('inventory.export-requests.store'), $this->storePayload())
            ->assertForbidden();
    }

    // -------------------------------------------------------------------------
    // Workflow
    // -------------------------------------------------------------------------

    private function makeDefaultTemplateWithStep(string $role): WorkflowTemplate
    {
        $template = WorkflowTemplate::create([
            'name' => 'Default Export Flow',
            'is_active' => true,
            'is_default' => true,
            'priority' => 100,
        ]);
        WorkflowStep::create([
            'workflow_template_id' => $template->id,
            'name' => 'Manager Approval',
            'sort_order' => 1,
            'approver_role' => $role,
        ]);

        return $template;
    }

    public function test_submit_with_template_initiates_workflow_and_step_approval_approves(): void
    {
        Role::findOrCreate('Export Approver');
        $this->user->assignRole('Export Approver');
        app(PermissionRegistrar::class)->forgetCachedPermissions();
        $this->makeDefaultTemplateWithStep('Export Approver');

        $this->seedStock(10);
        $service = app(StockExportRequestService::class);
        $er = $service->createRequest($this->storePayload());

        $service->submit($er);
        $er->refresh();
        $this->assertSame(StockExportRequestStatus::SUBMITTED, $er->status);
        $this->assertNotNull($er->workflow_template_id);
        $this->assertDatabaseHas('stock_export_request_approvals', [
            'stock_export_request_id' => $er->id,
            'status' => 'PENDING',
        ]);

        // Approve the active step → request becomes APPROVED
        $this->post(route('inventory.export-requests.approve-step', $er->id))
            ->assertRedirect();

        $this->assertSame(StockExportRequestStatus::APPROVED, $er->fresh()->status);
    }

    public function test_reject_step_returns_request_to_draft(): void
    {
        Role::findOrCreate('Export Approver');
        $this->user->assignRole('Export Approver');
        app(PermissionRegistrar::class)->forgetCachedPermissions();
        $this->makeDefaultTemplateWithStep('Export Approver');

        $this->seedStock(10);
        $service = app(StockExportRequestService::class);
        $er = $service->createRequest($this->storePayload());
        $service->submit($er);

        $this->post(route('inventory.export-requests.reject-step', $er->id), ['notes' => 'Not now'])
            ->assertRedirect();

        $this->assertSame(StockExportRequestStatus::DRAFT, $er->fresh()->status);
    }

    // -------------------------------------------------------------------------
    // Fulfillment (EXPORT transaction + FIFO deduction)
    // -------------------------------------------------------------------------

    public function test_fulfill_creates_export_transaction_and_deducts_stock_and_marks_fulfilled(): void
    {
        $lot = $this->seedStock(10);
        $service = app(StockExportRequestService::class);
        $er = $service->createRequest($this->storePayload()); // qty 3
        $er->update(['status' => StockExportRequestStatus::APPROVED->value]);

        $line = $er->lines->first();
        $service->fulfill($er, [
            'lines' => [['export_line_id' => $line->id, 'qty' => 3]],
        ]);

        $er->refresh();
        $this->assertSame(StockExportRequestStatus::FULFILLED, $er->status);
        $this->assertEquals(3, (float) $er->lines->first()->qty_fulfilled);

        // Stock deducted FIFO from the lot
        $this->assertEquals(7, (float) $lot->fresh()->quantity_base_units);

        // An EXPORT transaction + fulfillment were recorded
        $this->assertDatabaseHas('stock_export_request_fulfillments', [
            'stock_export_request_id' => $er->id,
        ]);
        $this->assertDatabaseHas('stock_transactions', [
            'transaction_type' => 'EXPORT',
            'store_id' => $this->store->id,
        ]);
    }

    public function test_partial_fulfillment_sets_partially_fulfilled(): void
    {
        $this->seedStock(10);
        $service = app(StockExportRequestService::class);
        $er = $service->createRequest($this->storePayload()); // qty 3
        $er->update(['status' => StockExportRequestStatus::APPROVED->value]);

        $line = $er->lines->first();
        $service->fulfill($er, [
            'lines' => [['export_line_id' => $line->id, 'qty' => 1]],
        ]);

        $this->assertSame(StockExportRequestStatus::PARTIALLY_FULFILLED, $er->fresh()->status);
    }

    public function test_fulfill_over_remaining_quantity_throws(): void
    {
        $this->seedStock(10);
        $service = app(StockExportRequestService::class);
        $er = $service->createRequest($this->storePayload()); // qty 3
        $er->update(['status' => StockExportRequestStatus::APPROVED->value]);

        $line = $er->lines->first();

        $this->expectException(RuntimeException::class);
        $service->fulfill($er, [
            'lines' => [['export_line_id' => $line->id, 'qty' => 5]],
        ]);
    }

    public function test_cancel_is_blocked_for_fulfilled_request(): void
    {
        $this->seedStock(10);
        $service = app(StockExportRequestService::class);
        $er = $service->createRequest($this->storePayload());
        $er->update(['status' => StockExportRequestStatus::FULFILLED->value]);

        $this->expectException(RuntimeException::class);
        $service->cancel($er);
    }

    public function test_fulfill_rejects_line_from_another_request(): void
    {
        $this->seedStock(10);
        $service = app(StockExportRequestService::class);

        $requestA = $service->createRequest($this->storePayload());
        $requestA->update(['status' => StockExportRequestStatus::APPROVED->value]);

        $requestB = $service->createRequest($this->storePayload());
        $foreignLine = $requestB->lines->first();

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessageMatches('/does not belong/');
        $service->fulfill($requestA, [
            'lines' => [['export_line_id' => $foreignLine->id, 'qty' => 1]],
        ]);
    }

    public function test_fulfill_rejects_duplicated_line_that_over_fulfills(): void
    {
        $this->seedStock(10);
        $service = app(StockExportRequestService::class);
        $er = $service->createRequest($this->storePayload()); // qty 3, remaining 3
        $er->update(['status' => StockExportRequestStatus::APPROVED->value]);

        $line = $er->lines->first();

        // Same line twice, each == remaining: aggregated 6 > remaining 3 must throw.
        $this->expectException(RuntimeException::class);
        $service->fulfill($er, [
            'lines' => [
                ['export_line_id' => $line->id, 'qty' => 3],
                ['export_line_id' => $line->id, 'qty' => 3],
            ],
        ]);
    }

    public function test_direct_approve_action_requires_approve_permission(): void
    {
        $this->seedStock(10);
        $service = app(StockExportRequestService::class);
        $er = $service->createRequest($this->storePayload());
        $er->update(['status' => StockExportRequestStatus::SUBMITTED->value]);

        // A user who can create but not approve must not approve via the action branch.
        $this->actingAs($this->userWithPermissions([
            'Inventory.ExportRequests.Create Export Request',
        ]));

        $this->put(route('inventory.export-requests.update', $er->id), ['action' => 'approve'])
            ->assertForbidden();

        $this->assertSame(StockExportRequestStatus::SUBMITTED, $er->fresh()->status);
    }
}
