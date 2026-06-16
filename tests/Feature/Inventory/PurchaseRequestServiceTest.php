<?php

namespace Tests\Feature\Inventory;

use App\Domains\Document\Services\DocumentService;
use App\Domains\Inventory\Enums\PurchaseRequestStatus;
use App\Domains\Inventory\Enums\TransactionStatus;
use App\Domains\Inventory\Enums\TransactionType;
use App\Domains\Inventory\Models\Item;
use App\Domains\Inventory\Models\PurchaseRequest;
use App\Domains\Inventory\Models\PurchaseRequestLine;
use App\Domains\Inventory\Models\Store;
use App\Domains\Inventory\Models\StockTransaction;
use App\Domains\Inventory\Models\Unit;
use App\Domains\Inventory\Models\WorkflowTemplate;
use App\Domains\Inventory\Services\PurchaseRequestService;
use App\Domains\Inventory\Services\PurchaseRequestWorkflowService;
use App\Domains\Inventory\Services\StockTransactionService;
use App\Domains\Inventory\Services\WorkflowTemplateMatcher;
use App\Domains\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use RuntimeException;
use Tests\TestCase;

class PurchaseRequestServiceTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Item $item;
    private Unit $unit;
    private Store $store;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->actingAs($this->user);

        $this->unit = Unit::create(['name' => 'Box', 'abbreviation' => 'bx']);

        $this->store = Store::create(['name' => 'PR Store', 'code' => 'PRS', 'is_active' => true]);

        $this->item = Item::create([
            'item_code'         => 'PR-ITEM-001',
            'name'              => 'PR Test Item',
            'department'        => 'LAB',
            'material_type'     => 'RGT',
            'storage_condition' => 'ROOM_TEMP',
            'default_unit_id'   => $this->unit->id,
            'is_active'         => true,
        ]);
    }

    private function makePr(array $attributes = []): PurchaseRequest
    {
        return PurchaseRequest::create(array_merge([
            'requested_by_user_id' => $this->user->id,
            'urgency'              => 'normal',
            'status'               => PurchaseRequestStatus::DRAFT->value,
            'notes'                => 'Test PR',
        ], $attributes));
    }

    private function addLine(PurchaseRequest $pr, float $qty = 10, float $unitPrice = 50): PurchaseRequestLine
    {
        return $pr->lines()->create([
            'item_id'              => $this->item->id,
            'unit_id'              => $this->unit->id,
            'qty'                  => $qty,
            'qty_received'         => 0,
            'estimated_unit_price' => $unitPrice,
        ]);
    }

    // -------------------------------------------------------------------------
    // I-14: createRequest matches workflow template after lines are saved
    // -------------------------------------------------------------------------

    public function test_create_pr_matches_workflow_template_after_lines_saved(): void
    {
        $template = WorkflowTemplate::create(['name' => 'Match Template']);

        $matcher = $this->mock(WorkflowTemplateMatcher::class);
        $matcher->shouldReceive('find')
            ->once()
            ->andReturn($template);

        // Other deps: workflow service not called during create
        $this->mock(PurchaseRequestWorkflowService::class)
            ->shouldNotReceive('initiate');

        $service = app(PurchaseRequestService::class);

        $pr = $service->createRequest([
            'urgency' => 'normal',
            'notes'   => 'Template test',
            'lines'   => [[
                'item_id'              => $this->item->id,
                'unit_id'              => $this->unit->id,
                'qty'                  => 5,
                'estimated_unit_price' => 100,
            ]],
        ]);

        $this->assertDatabaseHas('purchase_requests', [
            'id'                  => $pr->id,
            'workflow_template_id'=> $template->id,
        ]);
    }

    // -------------------------------------------------------------------------
    // I-15: submit() initiates workflow when template matched
    // -------------------------------------------------------------------------

    public function test_submit_pr_initiates_workflow_when_template_matched(): void
    {
        $template = WorkflowTemplate::create(['name' => 'Submit Template']);
        $pr = $this->makePr(['workflow_template_id' => $template->id]);
        $this->addLine($pr);
        $pr->load('lines');

        $matcher = $this->mock(WorkflowTemplateMatcher::class);
        $matcher->shouldReceive('find')->andReturn($template);

        $workflowMock = $this->mock(PurchaseRequestWorkflowService::class);
        $workflowMock->shouldReceive('initiate')->once()->with(Mockery::type(PurchaseRequest::class));

        $service = app(PurchaseRequestService::class);
        $result = $service->submit($pr);

        $this->assertEquals(PurchaseRequestStatus::SUBMITTED, $result->fresh()->status);
    }

    // -------------------------------------------------------------------------
    // I-16: submit() without template does NOT call initiate()
    // -------------------------------------------------------------------------

    public function test_submit_pr_without_template_skips_workflow_init(): void
    {
        $pr = $this->makePr(['workflow_template_id' => null]);
        $this->addLine($pr);

        // Matcher returns null → no template
        $matcher = $this->mock(WorkflowTemplateMatcher::class);
        $matcher->shouldReceive('find')->andReturn(null);

        $workflowMock = $this->mock(PurchaseRequestWorkflowService::class);
        $workflowMock->shouldNotReceive('initiate');

        $service = app(PurchaseRequestService::class);
        $result = $service->submit($pr);

        $this->assertEquals(PurchaseRequestStatus::SUBMITTED, $result->fresh()->status);
    }

    // -------------------------------------------------------------------------
    // I-17: scopeActiveApproverQuery — only lowest sort_order PENDING step visible
    // -------------------------------------------------------------------------

    public function test_scope_active_approver_query_returns_only_lowest_sort_order_pending_step(): void
    {
        // This test verifies pendingApprovalCount() counts only PRs where
        // the authenticated user is the active (lowest sort_order) approver.
        // We create two workflow steps; the user is only on step 2.
        // Since step 1 is still PENDING, step 2 should NOT be visible.

        // Create a submitted PR
        $pr = $this->makePr(['status' => PurchaseRequestStatus::SUBMITTED->value]);

        $template = WorkflowTemplate::create(['name' => 'Scope Template']);

        $templateStep1 = \Illuminate\Support\Facades\DB::table('workflow_steps')->insertGetId([
            'name'                 => 'Step 1',
            'workflow_template_id' => $template->id,
            'sort_order'           => 1,
            'approver_user_id'     => null,
            'approver_role'        => 'other_role',
            'created_at'           => now(),
            'updated_at'           => now(),
        ]);

        $templateStep2 = \Illuminate\Support\Facades\DB::table('workflow_steps')->insertGetId([
            'name'                 => 'Step 2',
            'workflow_template_id' => $template->id,
            'sort_order'           => 2,
            'approver_user_id'     => $this->user->id,
            'approver_role'        => null,
            'created_at'           => now(),
            'updated_at'           => now(),
        ]);

        // Both steps are PENDING — step 1 is lower sort_order, so this user should NOT see step 2
        \Illuminate\Support\Facades\DB::table('purchase_request_approvals')->insert([
            [
                'purchase_request_id' => $pr->id,
                'workflow_step_id'    => $templateStep1,
                'status'              => 'PENDING',
                'created_at'          => now(),
                'updated_at'          => now(),
            ],
            [
                'purchase_request_id' => $pr->id,
                'workflow_step_id'    => $templateStep2,
                'status'              => 'PENDING',
                'created_at'          => now(),
                'updated_at'          => now(),
            ],
        ]);

        // Mock WorkflowTemplateMatcher and WorkflowService since we don't need them here
        $this->mock(WorkflowTemplateMatcher::class)->shouldReceive('find')->andReturn(null);

        $service = app(PurchaseRequestService::class);
        $count = $service->pendingApprovalCount();

        $this->assertEquals(0, $count, 'User should not see step 2 while step 1 is still pending');
    }

    // -------------------------------------------------------------------------
    // I-18: receiveItems creates ENTRY transaction and updates qty_received
    // -------------------------------------------------------------------------

    public function test_receive_items_creates_entry_transaction_and_updates_qty_received(): void
    {
        $pr = $this->makePr(['status' => PurchaseRequestStatus::ORDERED->value]);
        $line = $this->addLine($pr, 10);

        // Mock transactionService so we don't need the full unit conversion stack
        $fakeTx = StockTransaction::create([
            'transaction_type'     => TransactionType::ENTRY->value,
            'reference_number'     => 'ENT-FAKE-001',
            'transaction_date'     => now()->toDateString(),
            'store_id'             => $this->store->id,
            'requested_by_user_id' => $this->user->id,
            'status'               => TransactionStatus::APPROVED->value,
        ]);

        $txServiceMock = $this->mock(StockTransactionService::class);
        $txServiceMock->shouldReceive('createTransaction')->once()->andReturn($fakeTx);
        $txServiceMock->shouldReceive('submitForApproval')->once()->andReturn($fakeTx);
        $txServiceMock->shouldReceive('approve')->once()->andReturn($fakeTx);

        $this->mock(WorkflowTemplateMatcher::class)->shouldReceive('find')->andReturn(null);

        $service = app(PurchaseRequestService::class);
        $service->receiveItems($pr, [
            'store_id' => $this->store->id,
            'lines'    => [[
                'pr_line_id' => $line->id,
                'qty'        => 5,
            ]],
        ]);

        $this->assertEqualsWithDelta(5, (float) $line->fresh()->qty_received, 0.001);
    }

    // -------------------------------------------------------------------------
    // I-19: receiveItems with partial quantity → PARTIALLY_RECEIVED status
    // -------------------------------------------------------------------------

    public function test_receive_items_partial_sets_partially_received_status(): void
    {
        $pr = $this->makePr(['status' => PurchaseRequestStatus::ORDERED->value]);
        $line = $this->addLine($pr, 10);

        $fakeTx = StockTransaction::create([
            'transaction_type'     => TransactionType::ENTRY->value,
            'reference_number'     => 'ENT-FAKE-002',
            'transaction_date'     => now()->toDateString(),
            'store_id'             => $this->store->id,
            'requested_by_user_id' => $this->user->id,
            'status'               => TransactionStatus::APPROVED->value,
        ]);

        $txServiceMock = $this->mock(StockTransactionService::class);
        $txServiceMock->shouldReceive('createTransaction')->once()->andReturn($fakeTx);
        $txServiceMock->shouldReceive('submitForApproval')->once()->andReturn($fakeTx);
        $txServiceMock->shouldReceive('approve')->once()->andReturn($fakeTx);

        $this->mock(WorkflowTemplateMatcher::class)->shouldReceive('find')->andReturn(null);

        $service = app(PurchaseRequestService::class);
        $result = $service->receiveItems($pr, [
            'store_id' => $this->store->id,
            'lines'    => [[
                'pr_line_id' => $line->id,
                'qty'        => 4,  // less than ordered qty of 10
            ]],
        ]);

        $this->assertEquals(PurchaseRequestStatus::PARTIALLY_RECEIVED, $result->fresh()->status);
    }

    // -------------------------------------------------------------------------
    // I-20: receiveItems throws when qty exceeds remaining
    // -------------------------------------------------------------------------

    public function test_receive_items_throws_when_qty_exceeds_remaining(): void
    {
        $pr = $this->makePr(['status' => PurchaseRequestStatus::ORDERED->value]);
        $line = $this->addLine($pr, 10);

        $this->mock(WorkflowTemplateMatcher::class)->shouldReceive('find')->andReturn(null);

        $service = app(PurchaseRequestService::class);

        $this->expectException(RuntimeException::class);

        $service->receiveItems($pr, [
            'store_id' => $this->store->id,
            'lines'    => [[
                'pr_line_id' => $line->id,
                'qty'        => 15, // exceeds ordered qty of 10
            ]],
        ]);
    }

    // -------------------------------------------------------------------------
    // I-21: receiveItems with all lines fully received → RECEIVED status
    // -------------------------------------------------------------------------

    public function test_receive_items_full_sets_received_status(): void
    {
        $pr = $this->makePr(['status' => PurchaseRequestStatus::ORDERED->value]);
        $line = $this->addLine($pr, 10);

        $fakeTx = StockTransaction::create([
            'transaction_type'     => TransactionType::ENTRY->value,
            'reference_number'     => 'ENT-FAKE-003',
            'transaction_date'     => now()->toDateString(),
            'store_id'             => $this->store->id,
            'requested_by_user_id' => $this->user->id,
            'status'               => TransactionStatus::APPROVED->value,
        ]);

        $txServiceMock = $this->mock(StockTransactionService::class);
        $txServiceMock->shouldReceive('createTransaction')->once()->andReturn($fakeTx);
        $txServiceMock->shouldReceive('submitForApproval')->once()->andReturn($fakeTx);
        $txServiceMock->shouldReceive('approve')->once()->andReturn($fakeTx);

        $this->mock(WorkflowTemplateMatcher::class)->shouldReceive('find')->andReturn(null);

        $service = app(PurchaseRequestService::class);
        $result = $service->receiveItems($pr, [
            'store_id' => $this->store->id,
            'lines'    => [[
                'pr_line_id' => $line->id,
                'qty'        => 10, // exactly ordered qty
            ]],
        ]);

        $this->assertEquals(PurchaseRequestStatus::RECEIVED, $result->fresh()->status);
    }

    // -------------------------------------------------------------------------
    // I-22: cancel() throws if status is RECEIVED
    // -------------------------------------------------------------------------

    public function test_cancel_pr_throws_if_fully_received(): void
    {
        $pr = $this->makePr(['status' => PurchaseRequestStatus::RECEIVED->value]);

        $this->mock(WorkflowTemplateMatcher::class)->shouldReceive('find')->andReturn(null);

        $service = app(PurchaseRequestService::class);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessageMatches('/cannot be cancelled/i');

        $service->cancel($pr);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }
}
