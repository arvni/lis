<?php

namespace Tests\Feature\Inventory;

use App\Domains\Document\Services\DocumentService;
use App\Domains\Inventory\Enums\PurchaseRequestStatus;
use App\Domains\Inventory\Enums\TransactionStatus;
use App\Domains\Inventory\Enums\TransactionType;
use App\Domains\Inventory\Models\Item;
use App\Domains\Inventory\Models\PurchaseRequest;
use App\Domains\Inventory\Models\PurchaseRequestLine;
use App\Domains\Inventory\Models\PurchaseRequestReceiptLine;
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
use PHPUnit\Framework\Attributes\DataProvider;
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
        $pr = $this->makePr(['status' => PurchaseRequestStatus::SHIPPED->value]);
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
        $pr = $this->makePr(['status' => PurchaseRequestStatus::SHIPPED->value]);
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
        $pr = $this->makePr(['status' => PurchaseRequestStatus::SHIPPED->value]);
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
        $pr = $this->makePr(['status' => PurchaseRequestStatus::SHIPPED->value]);
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

    // -------------------------------------------------------------------------
    // Lifecycle guards: each transition refuses the wrong starting status
    // -------------------------------------------------------------------------

    public function test_submit_throws_unless_draft(): void
    {
        $pr = $this->makePr(['status' => PurchaseRequestStatus::APPROVED->value]);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessageMatches('/Only draft/');

        app(PurchaseRequestService::class)->submit($pr);
    }

    public function test_direct_approve_throws_unless_submitted(): void
    {
        $pr = $this->makePr(['requested_by_user_id' => User::factory()->create()->id]); // DRAFT

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessageMatches('/Only submitted/');

        app(PurchaseRequestService::class)->approve($pr);
    }

    public function test_direct_approve_throws_when_request_has_a_workflow(): void
    {
        $template = WorkflowTemplate::create(['name' => 'Has Steps']);
        $pr = $this->makePr([
            'requested_by_user_id' => User::factory()->create()->id,
            'status'               => PurchaseRequestStatus::SUBMITTED->value,
            'workflow_template_id' => $template->id,
        ]);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessageMatches('/approval workflow/');

        app(PurchaseRequestService::class)->approve($pr);
    }

    public function test_requester_cannot_directly_approve_own_request(): void
    {
        // Requested by $this->user, who is also the acting user.
        $pr = $this->makePr(['status' => PurchaseRequestStatus::SUBMITTED->value]);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessageMatches('/your own/');

        app(PurchaseRequestService::class)->approve($pr);
    }

    public function test_direct_approve_approves_another_users_submitted_request(): void
    {
        $pr = $this->makePr([
            'requested_by_user_id' => User::factory()->create()->id,
            'status'               => PurchaseRequestStatus::SUBMITTED->value,
        ]);

        app(PurchaseRequestService::class)->approve($pr);

        $fresh = $pr->fresh();
        $this->assertSame(PurchaseRequestStatus::APPROVED, $fresh->status);
        $this->assertSame($this->user->id, $fresh->approved_by_user_id);
    }

    public function test_direct_approvals_number_purchase_orders_in_sequence(): void
    {
        $service = app(PurchaseRequestService::class);
        $first = $this->makePr(['requested_by_user_id' => User::factory()->create()->id, 'status' => PurchaseRequestStatus::SUBMITTED->value]);
        $second = $this->makePr(['requested_by_user_id' => User::factory()->create()->id, 'status' => PurchaseRequestStatus::SUBMITTED->value]);
        $draft = $this->makePr();

        $service->approve($first);
        $service->approve($second);

        $year = now()->year;
        $this->assertSame("PO-{$year}-0001", $first->fresh()->po_number);
        $this->assertSame("PO-{$year}-0002", $second->fresh()->po_number);
        $this->assertNull($draft->fresh()->po_number, 'a request that is not approved takes no number');
    }

    public function test_print_is_refused_until_the_request_has_a_po_number(): void
    {
        $pr = $this->makePr(['status' => PurchaseRequestStatus::SUBMITTED->value]);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessageMatches('/no purchase order yet/');

        app(PurchaseRequestService::class)->loadForPrint($pr);
    }

    public function test_print_still_names_an_item_archived_after_approval(): void
    {
        $pr = $this->makePr(['status' => PurchaseRequestStatus::APPROVED->value, 'po_number' => 'PO-2026-0001']);
        $this->addLine($pr);
        $this->item->delete();

        $props = app(PurchaseRequestService::class)->loadForPrint($pr);

        $this->assertSame('PR Test Item', $props['purchaseRequest']->lines->sole()->item?->name);
    }

    public function test_print_carries_the_signature_and_stamp_of_the_signer_chosen_at_issue(): void
    {
        $signer = User::factory()->create([
            'name'      => 'Dr. Layla Signer',
            'title'     => 'Laboratory Director',
            'signature' => '/documents/signature-doc/download',
            'stamp'     => '/documents/stamp-doc/download',
        ]);
        $pr = $this->makePr(['status' => PurchaseRequestStatus::APPROVED->value, 'po_number' => 'PO-2026-0001']);
        $service = app(PurchaseRequestService::class);

        $service->order($pr, null, $signer->id, null);
        $printed = $service->loadForPrint($pr->fresh())['purchaseRequest']->signer;

        $this->assertSame('Dr. Layla Signer', $printed->name);
        $this->assertSame('Laboratory Director', $printed->title);
        $this->assertSame('/documents/signature-doc/download', $printed->signature);
        $this->assertSame('/documents/stamp-doc/download', $printed->stamp);
    }

    public function test_order_payment_and_shipment_advance_in_sequence(): void
    {
        $pr = $this->makePr(['status' => PurchaseRequestStatus::APPROVED->value, 'po_number' => 'PO-2026-0005']);
        $service = app(PurchaseRequestService::class);

        $service->order($pr, null, $this->user->id, null);
        $this->assertSame(PurchaseRequestStatus::ORDERED, $pr->fresh()->status);
        $this->assertSame($this->user->id, $pr->fresh()->signer_user_id);
        $this->assertSame('PO-2026-0005', $pr->fresh()->po_number, 'issuing keeps the number given on approval');
        $this->assertDatabaseHas('purchase_request_histories', ['purchase_request_id' => $pr->id, 'event' => 'ORDERED', 'notes' => 'PO: PO-2026-0005']);

        $service->recordPayment($pr, ['payment_date' => '2026-09-13'], null);
        $this->assertSame(PurchaseRequestStatus::PAID, $pr->fresh()->status);

        $service->markShipped($pr, []);
        $this->assertSame(PurchaseRequestStatus::SHIPPED, $pr->fresh()->status);
    }

    /** @return array<string, array{string, PurchaseRequestStatus}> */
    public static function outOfOrderTransitions(): array
    {
        return [
            'order a draft'              => ['order', PurchaseRequestStatus::DRAFT],
            'order a submitted request'  => ['order', PurchaseRequestStatus::SUBMITTED],
            'pay an approved request'    => ['pay', PurchaseRequestStatus::APPROVED],
            'pay a shipped request'      => ['pay', PurchaseRequestStatus::SHIPPED],
            'ship an approved request'   => ['ship', PurchaseRequestStatus::APPROVED],
            'ship a received request'    => ['ship', PurchaseRequestStatus::RECEIVED],
            'receive an ordered request' => ['receive', PurchaseRequestStatus::ORDERED],
            'receive a cancelled one'    => ['receive', PurchaseRequestStatus::CANCELLED],
        ];
    }

    #[DataProvider('outOfOrderTransitions')]
    public function test_transition_is_refused_from_the_wrong_status(string $action, PurchaseRequestStatus $status): void
    {
        $pr = $this->makePr(['status' => $status->value]);
        $line = $this->addLine($pr, 10);
        $service = app(PurchaseRequestService::class);

        try {
            match ($action) {
                'order'   => $service->order($pr, null, $this->user->id, null),
                'pay'     => $service->recordPayment($pr, ['payment_date' => '2026-09-13'], null),
                'ship'    => $service->markShipped($pr, []),
                'receive' => $service->receiveItems($pr, [
                    'store_id' => $this->store->id,
                    'lines'    => [['pr_line_id' => $line->id, 'qty' => 1]],
                ]),
            };
            $this->fail("Expected '{$action}' to be refused from {$status->value}.");
        } catch (RuntimeException) {
            $this->assertSame($status, $pr->fresh()->status);
            $this->assertEquals(0, (float) $line->fresh()->qty_received);
            $this->assertSame(0, StockTransaction::count());
        }
    }

    public function test_receive_items_rejects_line_from_another_request(): void
    {
        $pr = $this->makePr(['status' => PurchaseRequestStatus::SHIPPED->value]);
        $this->addLine($pr, 10);
        $other = $this->makePr(['status' => PurchaseRequestStatus::SHIPPED->value]);
        $foreignLine = $this->addLine($other, 10);

        $this->mock(StockTransactionService::class)->shouldNotReceive('createTransaction');

        try {
            app(PurchaseRequestService::class)->receiveItems($pr, [
                'store_id' => $this->store->id,
                'lines'    => [['pr_line_id' => $foreignLine->id, 'qty' => 1]],
            ]);
            $this->fail('Expected a foreign line to be refused.');
        } catch (RuntimeException $e) {
            $this->assertStringContainsString('does not belong', $e->getMessage());
        }

        $this->assertEquals(0, (float) $foreignLine->fresh()->qty_received);
    }

    public function test_receive_items_rejects_duplicated_line_that_over_receives(): void
    {
        $pr = $this->makePr(['status' => PurchaseRequestStatus::SHIPPED->value]);
        $line = $this->addLine($pr, 10);

        $this->mock(StockTransactionService::class)->shouldNotReceive('createTransaction');

        // Each entry fits the remaining 10 on its own; together they are 12.
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessageMatches('/exceeds remaining/');

        app(PurchaseRequestService::class)->receiveItems($pr, [
            'store_id' => $this->store->id,
            'lines'    => [
                ['pr_line_id' => $line->id, 'qty' => 6],
                ['pr_line_id' => $line->id, 'qty' => 6],
            ],
        ]);
    }

    public function test_receive_items_accepts_one_line_split_across_two_lots(): void
    {
        $pr = $this->makePr(['status' => PurchaseRequestStatus::SHIPPED->value]);
        $line = $this->addLine($pr, 10);

        $fakeTx = StockTransaction::create([
            'transaction_type'     => TransactionType::ENTRY->value,
            'reference_number'     => 'ENT-FAKE-004',
            'transaction_date'     => now()->toDateString(),
            'store_id'             => $this->store->id,
            'requested_by_user_id' => $this->user->id,
            'status'               => TransactionStatus::APPROVED->value,
        ]);

        $txServiceMock = $this->mock(StockTransactionService::class);
        $txServiceMock->shouldReceive('createTransaction')->once()
            ->withArgs(fn (array $data) => count($data['lines']) === 2)
            ->andReturn($fakeTx);
        $txServiceMock->shouldReceive('submitForApproval')->once()->andReturn($fakeTx);
        $txServiceMock->shouldReceive('approve')->once()->andReturn($fakeTx);

        $result = app(PurchaseRequestService::class)->receiveItems($pr, [
            'store_id' => $this->store->id,
            'lines'    => [
                ['pr_line_id' => $line->id, 'qty' => 4, 'lot_number' => 'LOT-A'],
                ['pr_line_id' => $line->id, 'qty' => 6, 'lot_number' => 'LOT-B'],
            ],
        ]);

        $this->assertEqualsWithDelta(10, (float) $line->fresh()->qty_received, 0.001);
        $this->assertEquals(PurchaseRequestStatus::RECEIVED, $result->fresh()->status);
        $this->assertSame(2, PurchaseRequestReceiptLine::count());
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }
}
