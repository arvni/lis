<?php

namespace Tests\Feature\Billing;

use App\Domains\Billing\DTOs\InvoiceDTO;
use App\Domains\Billing\Enums\InvoiceItemKind;
use App\Domains\Billing\Enums\InvoiceStatus;
use App\Domains\Billing\Models\Invoice;
use App\Domains\Billing\Services\InvoiceComposer;
use App\Domains\Billing\Services\InvoiceItemSyncService;
use App\Domains\Billing\Services\InvoiceService;
use App\Domains\Laboratory\Enums\TestType;
use App\Domains\Laboratory\Models\Method;
use App\Domains\Laboratory\Models\MethodTest;
use App\Domains\Laboratory\Models\Test;
use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Models\AcceptanceItem;
use App\Domains\Reception\Models\Patient;
use App\Domains\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Tests\TestCase;

class InvoiceServiceTest extends TestCase
{
    use RefreshDatabase;

    private InvoiceService $service;
    private User $user;
    private Patient $patient;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->patient = Patient::create([
            'fullName' => 'Test Patient',
            'idNo' => 'TEST001',
            'nationality' => 'OM',
            'dateOfBirth' => '1990-01-01',
            'gender' => 'male',
            'registrar_id' => $this->user->id,
        ]);

        $this->service = app(InvoiceService::class);
    }

    /**
     * B-01: storeInvoice creates a persisted invoice with correct owner fields.
     */
    public function test_store_invoice_persists_record(): void
    {
        $dto = new InvoiceDTO(
            ownerType: 'patient',
            ownerId: $this->patient->id,
            userId: $this->user->id,
        );

        $invoice = $this->service->storeInvoice($dto);

        $this->assertDatabaseHas('invoices', [
            'id' => $invoice->id,
            'owner_type' => 'patient',
            'owner_id' => $this->patient->id,
            'user_id' => $this->user->id,
        ]);
    }

    /**
     * B-09: updateStatus sets WAITING_FOR_PAYMENT when no payments exist.
     */
    public function test_update_status_handles_unpaid_invoice(): void
    {
        $invoice = Invoice::create([
            'owner_type' => 'patient',
            'owner_id' => $this->patient->id,
            'user_id' => $this->user->id,
            'status' => InvoiceStatus::WAITING_FOR_PAYMENT,
            'discount' => 0,
        ]);

        $acceptance = Acceptance::create([
            'patient_id' => $this->patient->id,
            'invoice_id' => $invoice->id,
            'acceptor_id' => $this->user->id,
            'status' => 'pending',
            'step' => 1,
            'financial_approved' => false,
            'out_patient' => false,
            'waiting_for_pooling' => false,
        ]);

        $method = Method::create(['name' => 'M1', 'price' => 100, 'status' => true, 'no_patient' => 1, 'no_sample' => 1]);
        $test = Test::create(['name' => 'T1', 'fullName' => 'T1', 'code' => 'T001', 'type' => TestType::TEST, 'status' => true, 'can_merge' => false]);
        $methodTest = MethodTest::create(['method_id' => $method->id, 'test_id' => $test->id, 'is_default' => true, 'status' => true]);

        AcceptanceItem::create([
            'acceptance_id' => $acceptance->id,
            'method_test_id' => $methodTest->id,
            'price' => 100,
            'discount' => 0,
        ]);

        // updateStatus derives status from invoice_items totals, so compose them first;
        // otherwise totalAmount() is 0 and an unpaid invoice reads as fully paid.
        app(InvoiceComposer::class)->recompose($invoice);

        $this->service->updateStatus($invoice);

        $this->assertDatabaseHas('invoices', [
            'id' => $invoice->id,
            'status' => InvoiceStatus::WAITING_FOR_PAYMENT->value,
        ]);
    }

    /**
     * B-12: loadForShow groups PANEL acceptance items by panel_id and sums price/discount.
     */
    public function test_load_for_show_groups_panel_items_and_sums_price(): void
    {
        $invoice = Invoice::create([
            'owner_type' => 'patient',
            'owner_id' => $this->patient->id,
            'user_id' => $this->user->id,
            'status' => InvoiceStatus::WAITING_FOR_PAYMENT,
            'discount' => 0,
        ]);

        $acceptance = Acceptance::create([
            'patient_id' => $this->patient->id,
            'invoice_id' => $invoice->id,
            'acceptor_id' => $this->user->id,
            'status' => 'pending',
            'step' => 1,
            'financial_approved' => false,
            'out_patient' => false,
            'waiting_for_pooling' => false,
        ]);

        $method = Method::create(['name' => 'Panel Method', 'price' => 50, 'status' => true, 'no_patient' => 1, 'no_sample' => 1]);
        $panelTest = Test::create(['name' => 'Panel Test', 'fullName' => 'Panel Test', 'code' => 'P001', 'type' => TestType::PANEL, 'status' => true, 'can_merge' => false]);
        $methodTest = MethodTest::create(['method_id' => $method->id, 'test_id' => $panelTest->id, 'is_default' => true, 'status' => true]);

        $panelId = 99;

        AcceptanceItem::create([
            'acceptance_id' => $acceptance->id,
            'method_test_id' => $methodTest->id,
            'price' => 50,
            'discount' => 5,
            'panel_id' => $panelId,
        ]);
        AcceptanceItem::create([
            'acceptance_id' => $acceptance->id,
            'method_test_id' => $methodTest->id,
            'price' => 70,
            'discount' => 10,
            'panel_id' => $panelId,
        ]);

        $result = $this->service->loadForShow($invoice);

        // loadForShow now returns composed invoice_items; panels collapse into one PANEL line
        // tagged with panel_id (the line's own id is the invoice_item id).
        $panelItems = collect($result['acceptance_items'])->filter(
            fn($item) => ($item['panel_id'] ?? null) == $panelId
        );

        $this->assertCount(1, $panelItems, 'Panel items with same panel_id must be grouped into one entry');

        $grouped = $panelItems->first();
        $this->assertEquals('panel', $grouped['kind']);
        $this->assertEquals(120, $grouped['price']);
        $this->assertEquals(15, $grouped['discount']);
    }

    /**
     * B-13: loadForShow merges acceptance items whose test has can_merge=true into a single line.
     */
    public function test_load_for_show_merges_mergeable_test_items_into_single_line(): void
    {
        $invoice = Invoice::create([
            'owner_type' => 'patient',
            'owner_id' => $this->patient->id,
            'user_id' => $this->user->id,
            'status' => InvoiceStatus::WAITING_FOR_PAYMENT,
            'discount' => 0,
        ]);

        $acceptance = Acceptance::create([
            'patient_id' => $this->patient->id,
            'invoice_id' => $invoice->id,
            'acceptor_id' => $this->user->id,
            'status' => 'pending',
            'step' => 1,
            'financial_approved' => false,
            'out_patient' => false,
            'waiting_for_pooling' => false,
        ]);

        $method = Method::create(['name' => 'Merge Method', 'price' => 30, 'status' => true, 'no_patient' => 1, 'no_sample' => 1]);
        $mergeableTest = Test::create(['name' => 'CBC', 'fullName' => 'CBC', 'code' => 'CBC01', 'type' => TestType::TEST, 'status' => true, 'can_merge' => true]);
        $methodTest = MethodTest::create(['method_id' => $method->id, 'test_id' => $mergeableTest->id, 'is_default' => true, 'status' => true]);

        AcceptanceItem::create([
            'acceptance_id' => $acceptance->id,
            'method_test_id' => $methodTest->id,
            'price' => 30,
            'discount' => 0,
        ]);
        AcceptanceItem::create([
            'acceptance_id' => $acceptance->id,
            'method_test_id' => $methodTest->id,
            'price' => 30,
            'discount' => 0,
        ]);

        $result = $this->service->loadForShow($invoice);

        $merged = collect($result['acceptance_items'])->filter(
            fn($item) => isset($item['test']['id']) && $item['test']['id'] == $mergeableTest->id
        );

        $this->assertCount(1, $merged, 'Two mergeable items for the same test must be collapsed to one line');

        $line = $merged->first();
        $this->assertEquals(2, $line['qty']);
        $this->assertEquals(60, $line['price']);
    }

    /**
     * B-14: a manual line submitted without an id is created as a locked manual_fee row
     * with price = unit_price * qty. (Replaces the removed InvoiceService::updateInvoiceItems;
     * user-submitted item edits now go through InvoiceItemSyncService.)
     */
    public function test_sync_creates_and_locks_a_manual_line(): void
    {
        $invoice = Invoice::create([
            'owner_type' => 'patient',
            'owner_id' => $this->patient->id,
            'user_id' => $this->user->id,
            'status' => InvoiceStatus::WAITING_FOR_PAYMENT,
            'discount' => 0,
        ]);

        $summary = app(InvoiceItemSyncService::class)->sync($invoice, [
            ['title' => 'Extra handling fee', 'unit_price' => 25, 'qty' => 2],
        ]);

        $this->assertSame(1, $summary['created']);

        $item = $invoice->invoiceItems()->firstOrFail();
        $this->assertSame(InvoiceItemKind::MANUAL_FEE, $item->kind);
        $this->assertTrue($item->isLocked());
        $this->assertEquals(50, $item->price);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }
}
