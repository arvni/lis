<?php

namespace Tests\Feature\Billing;

use App\Domains\Billing\Enums\InvoiceItemKind;
use App\Domains\Billing\Enums\InvoiceStatus;
use App\Domains\Billing\Models\Invoice;
use App\Domains\Billing\Models\InvoiceItem;
use App\Domains\Billing\Services\InvoiceComposer;
use App\Domains\Billing\Services\InvoiceItemSyncService;
use App\Domains\Laboratory\Enums\TestType;
use App\Domains\Laboratory\Models\Method;
use App\Domains\Laboratory\Models\MethodTest;
use App\Domains\Laboratory\Models\Test;
use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Models\AcceptanceItem;
use App\Domains\Reception\Models\Patient;
use App\Domains\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InvoiceComposerTest extends TestCase
{
    use RefreshDatabase;

    private InvoiceComposer $composer;
    private InvoiceItemSyncService $sync;
    private User $user;
    private Patient $patient;

    protected function setUp(): void
    {
        parent::setUp();

        $this->composer = app(InvoiceComposer::class);
        $this->sync = app(InvoiceItemSyncService::class);

        $this->user = User::factory()->create();
        $this->patient = Patient::create([
            'fullName' => 'Test Patient',
            'idNo' => 'TEST001',
            'nationality' => 'OM',
            'dateOfBirth' => '1990-01-01',
            'gender' => 'male',
            'registrar_id' => $this->user->id,
        ]);
    }

    /**
     * IC-01: recompose generates one TEST line per non-mergeable acceptance item,
     * carrying the acceptance item's price.
     */
    public function test_recompose_creates_a_line_per_test(): void
    {
        $invoice = $this->makeInvoice();
        $acceptance = $this->makeAcceptance($invoice);
        $this->addItem($acceptance, $this->makeTest('T1', 'T001'), price: 100);

        $count = $this->composer->recompose($invoice);

        $this->assertSame(1, $count);
        $this->assertSame(1, $invoice->invoiceItems()->count());
        $this->assertDatabaseHas('invoice_items', [
            'invoice_id' => $invoice->id,
            'kind' => InvoiceItemKind::TEST->value,
            'qty' => 1,
            'price' => 100,
        ]);
    }

    /**
     * IC-02: a user-deleted line (tombstone: locked + soft-deleted) is honored on the
     * next recompose and is NOT regenerated, even though its acceptance item is still present.
     */
    public function test_user_deleted_line_stays_gone_across_recompose(): void
    {
        $invoice = $this->makeInvoice();
        $acceptance = $this->makeAcceptance($invoice);
        $this->addItem($acceptance, $this->makeTest('T1', 'T001'), price: 100);

        $this->composer->recompose($invoice);
        $item = $invoice->invoiceItems()->firstOrFail();

        // User deletes the line through the normal sync path.
        $this->sync->sync($invoice, [['id' => $item->id, '_destroy' => true]]);

        $afterDelete = $this->composer->recompose($invoice);

        $this->assertSame(0, $afterDelete, 'Deleted line must not come back on recompose');
        $this->assertSame(0, $invoice->invoiceItems()->count());
        // The row survives as a locked tombstone rather than being hard-deleted.
        $this->assertSoftDeleted('invoice_items', ['id' => $item->id]);
        $this->assertNotNull($invoice->invoiceItems()->withTrashed()->find($item->id)->locked_at);
    }

    /**
     * IC-03: a trashed-but-UNLOCKED row (leftover from a previous sweep) is treated as
     * stale: the composer rebuilds a fresh live line for that bucket.
     */
    public function test_unlocked_trashed_leftover_is_rebuilt(): void
    {
        $invoice = $this->makeInvoice();
        $acceptance = $this->makeAcceptance($invoice);
        $this->addItem($acceptance, $this->makeTest('T1', 'T001'), price: 100);

        $this->composer->recompose($invoice);
        $original = $invoice->invoiceItems()->firstOrFail();

        // Simulate a sweep leftover: soft-deleted but NOT locked.
        $original->delete();

        $count = $this->composer->recompose($invoice);

        $this->assertSame(1, $count);
        $fresh = $invoice->invoiceItems()->firstOrFail();
        $this->assertNotSame($original->id, $fresh->id, 'A new live row should be created for the bucket');
    }

    /**
     * IC-04: "Rebuild from acceptance items" clears the deletion tombstone and brings the
     * line back. Mirrors InvoiceItemController::rebuild's clear step + a forced recompose.
     */
    public function test_rebuild_clears_tombstone_and_brings_line_back(): void
    {
        $invoice = $this->makeInvoice();
        $acceptance = $this->makeAcceptance($invoice);
        $this->addItem($acceptance, $this->makeTest('T1', 'T001'), price: 100);

        $this->composer->recompose($invoice);
        $item = $invoice->invoiceItems()->firstOrFail();
        $this->sync->sync($invoice, [['id' => $item->id, '_destroy' => true]]);

        // Rebuild: drop tombstones, reset derived rows to auto, then force a recompose.
        $invoice->invoiceItems()->onlyTrashed()->forceDelete();
        $invoice->invoiceItems()
            ->whereIn('kind', [InvoiceItemKind::TEST->value, InvoiceItemKind::PANEL->value])
            ->update(['locked_at' => null]);
        $count = $this->composer->recompose($invoice, force: true);

        $this->assertSame(1, $count, 'Rebuild must regenerate the deleted line');
        $this->assertSame(0, $invoice->invoiceItems()->onlyTrashed()->count(), 'Tombstone must be gone');
    }

    /**
     * IC-05: locked (user-edited) lines keep their fields; recompose does not overwrite them.
     */
    public function test_locked_line_fields_are_preserved(): void
    {
        $invoice = $this->makeInvoice();
        $acceptance = $this->makeAcceptance($invoice);
        $this->addItem($acceptance, $this->makeTest('T1', 'T001'), price: 100);

        $this->composer->recompose($invoice);
        $item = $invoice->invoiceItems()->firstOrFail();

        // User overrides the price; updating locks the row.
        $this->sync->sync($invoice, [[
            'id' => $item->id,
            'unit_price' => 250,
            'qty' => 1,
        ]]);

        $this->composer->recompose($invoice);

        $item->refresh();
        $this->assertTrue($item->isLocked());
        $this->assertEquals(250, $item->price);
    }

    /**
     * IC-06: recompose is skipped on a settled/statemented invoice unless forced.
     */
    public function test_recompose_is_skipped_on_locked_invoice_unless_forced(): void
    {
        $invoice = $this->makeInvoice(['status' => InvoiceStatus::PAID]);
        $acceptance = $this->makeAcceptance($invoice);
        $this->addItem($acceptance, $this->makeTest('T1', 'T001'), price: 100);

        $skipped = $this->composer->recompose($invoice);
        $this->assertSame(0, $skipped, 'Paid invoices should not auto-compose');
        $this->assertSame(0, $invoice->invoiceItems()->count());

        $forced = $this->composer->recompose($invoice, force: true);
        $this->assertSame(1, $forced, 'force: true must bypass the paid/statemented lock');
    }

    /**
     * IC-07: panel acceptance items sharing a panel_id collapse into one PANEL line with
     * qty=1 and price summed across the panel's children.
     */
    public function test_recompose_groups_panel_items_into_one_line(): void
    {
        $invoice = $this->makeInvoice();
        $acceptance = $this->makeAcceptance($invoice);
        $panelTest = $this->makeTest('Panel', 'P001', TestType::PANEL);
        $this->addItem($acceptance, $panelTest, price: 50, panelId: 99);
        $this->addItem($acceptance, $panelTest, price: 70, panelId: 99);

        $count = $this->composer->recompose($invoice);

        $this->assertSame(1, $count);
        $line = $invoice->invoiceItems()->firstOrFail();
        $this->assertSame(InvoiceItemKind::PANEL, $line->kind);
        $this->assertSame(1, $line->qty);
        $this->assertEquals(120, $line->price);
    }

    /**
     * IC-08: mergeable tests (can_merge=true) collapse into a single line with qty=count
     * and price summed.
     */
    public function test_recompose_merges_mergeable_test_items(): void
    {
        $invoice = $this->makeInvoice();
        $acceptance = $this->makeAcceptance($invoice);
        $mergeable = $this->makeTest('CBC', 'CBC01', TestType::TEST, canMerge: true);
        $this->addItem($acceptance, $mergeable, price: 30);
        $this->addItem($acceptance, $mergeable, price: 30);

        $count = $this->composer->recompose($invoice);

        $this->assertSame(1, $count);
        $line = $invoice->invoiceItems()->firstOrFail();
        $this->assertSame(2, $line->qty);
        $this->assertEquals(60, $line->price);
    }

    // --- helpers ---------------------------------------------------------

    private function makeInvoice(array $overrides = []): Invoice
    {
        return Invoice::create(array_merge([
            'owner_type' => 'patient',
            'owner_id' => $this->patient->id,
            'user_id' => $this->user->id,
            'status' => InvoiceStatus::WAITING_FOR_PAYMENT,
            'discount' => 0,
        ], $overrides));
    }

    private function makeAcceptance(Invoice $invoice): Acceptance
    {
        return Acceptance::create([
            'patient_id' => $this->patient->id,
            'invoice_id' => $invoice->id,
            'acceptor_id' => $this->user->id,
            'status' => 'pending',
            'step' => 1,
            'financial_approved' => false,
            'out_patient' => false,
            'waiting_for_pooling' => false,
        ]);
    }

    private function makeTest(string $name, string $code, TestType $type = TestType::TEST, bool $canMerge = false): Test
    {
        return Test::create([
            'name' => $name,
            'fullName' => $name,
            'code' => $code,
            'type' => $type,
            'status' => true,
            'can_merge' => $canMerge,
        ]);
    }

    private function addItem(Acceptance $acceptance, Test $test, float $price, float $discount = 0, ?int $panelId = null): AcceptanceItem
    {
        $method = Method::create([
            'name' => 'M-' . $test->code,
            'price' => $price,
            'status' => true,
            'no_patient' => 1,
            'no_sample' => 1,
        ]);
        $methodTest = MethodTest::create([
            'method_id' => $method->id,
            'test_id' => $test->id,
            'is_default' => true,
            'status' => true,
        ]);

        return AcceptanceItem::create([
            'acceptance_id' => $acceptance->id,
            'method_test_id' => $methodTest->id,
            'price' => $price,
            'discount' => $discount,
            'panel_id' => $panelId,
        ]);
    }
}
