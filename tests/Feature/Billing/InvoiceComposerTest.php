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
use App\Domains\Referrer\Models\Referrer;
use App\Domains\Referrer\Models\ReferrerTest;
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

    /**
     * IC-09: a switched-on test added twice becomes ONE line, qty 1, with the parameters summed
     * in the description (5 + 4 embryos = 9) and the full total as its price.
     */
    public function test_combined_test_added_twice_is_one_line_with_summed_parameters(): void
    {
        $invoice = $this->makeInvoice();
        $acceptance = $this->makeAcceptance($invoice);
        $test = $this->makeTest('PGT-A', 'PGT01');
        $method = $this->makeMethod($test, 950, $this->pricing('noEmbryos', combine: true));
        $this->addItem($acceptance, $test, price: 950, customParameters: ['price' => ['noEmbryos' => '5']], method: $method);
        $this->addItem($acceptance, $test, price: 760, customParameters: ['price' => ['noEmbryos' => '4']], method: $method);

        $this->assertSame(1, $this->composer->recompose($invoice));

        $line = $invoice->invoiceItems()->firstOrFail();
        $this->assertSame(1, $line->qty);
        $this->assertEquals(1710, $line->unit_price);
        $this->assertEquals(1710, $line->price);
        $this->assertSame('No Embryos=9', $line->description);
        $this->assertSame(2, $line->acceptanceItems()->count());
    }

    /**
     * IC-10: the same test without the switch keeps today's lines: one per time it was added,
     * each with its own value. Combining is never automatic.
     */
    public function test_test_without_switch_keeps_separate_lines(): void
    {
        $invoice = $this->makeInvoice();
        $acceptance = $this->makeAcceptance($invoice);
        $test = $this->makeTest('PGT-A', 'PGT01');
        $method = $this->makeMethod($test, 950, $this->pricing('noEmbryos', combine: false));
        $this->addItem($acceptance, $test, price: 950, customParameters: ['price' => ['noEmbryos' => '5']], method: $method);
        $this->addItem($acceptance, $test, price: 760, customParameters: ['price' => ['noEmbryos' => '4']], method: $method);

        $this->assertSame(2, $this->composer->recompose($invoice));

        $descriptions = $invoice->invoiceItems()->orderBy('id')->pluck('description')->all();
        $this->assertSame(['No Embryos=5', 'No Embryos=4'], $descriptions);
        $this->assertSame([1, 1], $invoice->invoiceItems()->pluck('qty')->all());
    }

    /**
     * IC-11: a mergeable test without the switch still merges as before (qty = count).
     */
    public function test_mergeable_test_without_switch_still_counts_qty(): void
    {
        $invoice = $this->makeInvoice();
        $acceptance = $this->makeAcceptance($invoice);
        $test = $this->makeTest('PGT-A', 'PGT01', canMerge: true);
        $method = $this->makeMethod($test, 950, $this->pricing('noEmbryos', combine: false));
        $this->addItem($acceptance, $test, price: 950, customParameters: ['price' => ['noEmbryos' => '5']], method: $method);
        $this->addItem($acceptance, $test, price: 950, customParameters: ['price' => ['noEmbryos' => '5']], method: $method);

        $this->composer->recompose($invoice);

        $this->assertSame(2, $invoice->invoiceItems()->firstOrFail()->qty);
    }

    /**
     * IC-12: a switched-on panel added twice is one line, qty 1; each panel addition counts its
     * panel-level value once (not once per child test): 4 + 3 embryos = 7.
     */
    public function test_combined_panel_added_twice_sums_each_panel_once(): void
    {
        $invoice = $this->makeInvoice();
        $acceptance = $this->makeAcceptance($invoice);
        $panel = $this->makeTest('PGT Panel', 'PGTP', TestType::PANEL, extra: $this->pricing('noEmbryos', combine: true));
        $childA = $this->makeMethod($panel, 0);
        $childB = $this->makeMethod($panel, 0);
        foreach ([[101, '4', 400], [102, '3', 300]] as [$panelId, $embryos, $half]) {
            $params = ['price' => ['noEmbryos' => $embryos]];
            $this->addItem($acceptance, $panel, price: $half, panelId: $panelId, customParameters: $params, method: $childA);
            $this->addItem($acceptance, $panel, price: $half, panelId: $panelId, customParameters: $params, method: $childB);
        }

        $this->assertSame(1, $this->composer->recompose($invoice));

        $line = $invoice->invoiceItems()->firstOrFail();
        $this->assertSame(InvoiceItemKind::PANEL, $line->kind);
        $this->assertSame(1, $line->qty);
        $this->assertEquals(1400, $line->price);
        $this->assertSame('No Embryos=7', $line->description);
    }

    /**
     * IC-13: recomposing again updates the same combined row instead of adding a new one.
     */
    public function test_combined_line_is_stable_across_recompose(): void
    {
        $invoice = $this->makeInvoice();
        $acceptance = $this->makeAcceptance($invoice);
        $test = $this->makeTest('PGT-A', 'PGT01');
        $method = $this->makeMethod($test, 950, $this->pricing('noEmbryos', combine: true));
        $this->addItem($acceptance, $test, price: 950, customParameters: ['price' => ['noEmbryos' => '5']], method: $method);
        $this->addItem($acceptance, $test, price: 760, customParameters: ['price' => ['noEmbryos' => '4']], method: $method);

        $this->composer->recompose($invoice);
        $first = $invoice->invoiceItems()->firstOrFail();
        $this->addItem($acceptance, $test, price: 190, customParameters: ['price' => ['noEmbryos' => '1']], method: $method);
        $this->composer->recompose($invoice->fresh());

        $this->assertSame(1, $invoice->invoiceItems()->count());
        $line = $invoice->invoiceItems()->firstOrFail();
        $this->assertSame($first->id, $line->id);
        $this->assertSame('No Embryos=10', $line->description);
        $this->assertEquals(1900, $line->price);
    }

    /**
     * IC-14: a referred acceptance uses the switch on the referrer default price, even when it
     * names its parameter differently from the normal price.
     */
    public function test_referred_acceptance_uses_the_referrer_default_switch(): void
    {
        $invoice = $this->makeInvoice();
        $acceptance = $this->makeAcceptance($invoice, $this->makeReferrer());
        $test = $this->makeTest('PGT-A', 'PGT01');
        $method = $this->makeMethod($test, 600, extra: null, referrerExtra: $this->pricing('embryos', combine: true));
        $this->addItem($acceptance, $test, price: 600, customParameters: ['price' => ['embryos' => '4']], method: $method);
        $this->addItem($acceptance, $test, price: 300, customParameters: ['price' => ['embryos' => '2']], method: $method);

        $this->assertSame(1, $this->composer->recompose($invoice));

        $line = $invoice->invoiceItems()->firstOrFail();
        $this->assertSame(1, $line->qty);
        $this->assertSame('Embryos=6', $line->description);
        $this->assertEquals(900, $line->price);
    }

    /**
     * IC-15: a referrer's own price list (per method) can switch combining on by itself.
     */
    public function test_referrer_price_list_method_switch_is_used(): void
    {
        $invoice = $this->makeInvoice();
        $referrer = $this->makeReferrer();
        $acceptance = $this->makeAcceptance($invoice, $referrer);
        $test = $this->makeTest('PGT-A', 'PGT01');
        $method = $this->makeMethod($test, 450);
        ReferrerTest::create([
            'referrer_id' => $referrer->id,
            'test_id' => $test->id,
            'price_type' => 'Fix',
            'price' => 0,
            'methods' => [[
                'method_id' => $method->method_id,
                'price_type' => 'Formulate',
                'extra' => $this->pricing('cells', combine: true),
            ]],
        ]);
        $this->addItem($acceptance, $test, price: 450, customParameters: ['price' => ['cells' => '3']], method: $method);
        $this->addItem($acceptance, $test, price: 150, customParameters: ['price' => ['cells' => '1']], method: $method);

        $this->assertSame(1, $this->composer->recompose($invoice));
        $this->assertSame('Cells=4', $invoice->invoiceItems()->firstOrFail()->description);
    }

    /**
     * IC-16: a referrer's own panel price can switch combining on for a panel.
     */
    public function test_referrer_price_list_panel_switch_is_used(): void
    {
        $invoice = $this->makeInvoice();
        $referrer = $this->makeReferrer();
        $acceptance = $this->makeAcceptance($invoice, $referrer);
        $panel = $this->makeTest('PGT Panel', 'PGTP', TestType::PANEL);
        ReferrerTest::create([
            'referrer_id' => $referrer->id,
            'test_id' => $panel->id,
            'price_type' => 'Formulate',
            'price' => 0,
            'extra' => $this->pricing('noEmbryos', combine: true),
        ]);
        $child = $this->makeMethod($panel, 0);
        $this->addItem($acceptance, $panel, price: 300, panelId: 201, customParameters: ['price' => ['noEmbryos' => '2']], method: $child);
        $this->addItem($acceptance, $panel, price: 450, panelId: 202, customParameters: ['price' => ['noEmbryos' => '3']], method: $child);

        $this->assertSame(1, $this->composer->recompose($invoice));
        $line = $invoice->invoiceItems()->firstOrFail();
        $this->assertSame(1, $line->qty);
        $this->assertSame('No Embryos=5', $line->description);
    }

    /**
     * IC-17: a walk-in patient is priced by the normal price only, so a switch set just on the
     * referrer price does not combine their lines.
     */
    public function test_patient_acceptance_ignores_referrer_only_switch(): void
    {
        $invoice = $this->makeInvoice();
        $acceptance = $this->makeAcceptance($invoice);
        $test = $this->makeTest('PGT-A', 'PGT01');
        $method = $this->makeMethod(
            $test,
            950,
            extra: $this->pricing('noEmbryos', combine: false),
            referrerExtra: $this->pricing('noEmbryos', combine: true),
        );
        $this->addItem($acceptance, $test, price: 950, customParameters: ['price' => ['noEmbryos' => '5']], method: $method);
        $this->addItem($acceptance, $test, price: 760, customParameters: ['price' => ['noEmbryos' => '4']], method: $method);

        $this->assertSame(2, $this->composer->recompose($invoice));
    }

    /**
     * IC-18: a panel switched to "merge on invoice", added twice at a fixed price, is one line
     * with qty 2 and one panel's price as the rate.
     */
    public function test_mergeable_panel_added_twice_is_one_line_with_qty_two(): void
    {
        $invoice = $this->makeInvoice();
        $acceptance = $this->makeAcceptance($invoice);
        $panel = $this->makeTest('Embryo Panel', 'EMBP', TestType::PANEL, canMerge: true);
        $childA = $this->makeMethod($panel, 0);
        $childB = $this->makeMethod($panel, 0);
        foreach ([301, 302] as $panelId) {
            $this->addItem($acceptance, $panel, price: 400, panelId: $panelId, method: $childA);
            $this->addItem($acceptance, $panel, price: 200, panelId: $panelId, method: $childB);
        }

        $this->assertSame(1, $this->composer->recompose($invoice));

        $line = $invoice->invoiceItems()->firstOrFail();
        $this->assertSame(InvoiceItemKind::PANEL, $line->kind);
        $this->assertSame(2, $line->qty);
        $this->assertEquals(600, $line->unit_price);
        $this->assertEquals(1200, $line->price);
        $this->assertSame(4, $line->acceptanceItems()->count());
    }

    /**
     * IC-19: without the switch a panel added twice keeps one line per time it was added.
     */
    public function test_panel_without_merge_keeps_one_line_per_addition(): void
    {
        $invoice = $this->makeInvoice();
        $acceptance = $this->makeAcceptance($invoice);
        $panel = $this->makeTest('Embryo Panel', 'EMBP', TestType::PANEL, canMerge: false);
        $child = $this->makeMethod($panel, 0);
        $this->addItem($acceptance, $panel, price: 600, panelId: 401, method: $child);
        $this->addItem($acceptance, $panel, price: 600, panelId: 402, method: $child);

        $this->assertSame(2, $this->composer->recompose($invoice));
        $this->assertSame([1, 1], $invoice->invoiceItems()->pluck('qty')->all());
    }

    /**
     * IC-20: adding the mergeable panel a third time updates the same line to qty 3.
     */
    public function test_mergeable_panel_line_is_stable_across_recompose(): void
    {
        $invoice = $this->makeInvoice();
        $acceptance = $this->makeAcceptance($invoice);
        $panel = $this->makeTest('Embryo Panel', 'EMBP', TestType::PANEL, canMerge: true);
        $child = $this->makeMethod($panel, 0);
        $this->addItem($acceptance, $panel, price: 600, panelId: 501, method: $child);
        $this->addItem($acceptance, $panel, price: 600, panelId: 502, method: $child);
        $this->composer->recompose($invoice);
        $first = $invoice->invoiceItems()->firstOrFail();

        $this->addItem($acceptance, $panel, price: 600, panelId: 503, method: $child);
        $this->composer->recompose($invoice->fresh());

        $line = $invoice->invoiceItems()->firstOrFail();
        $this->assertSame(1, $invoice->invoiceItems()->count());
        $this->assertSame($first->id, $line->id);
        $this->assertSame(3, $line->qty);
        $this->assertEquals(1800, $line->price);
    }

    /**
     * IC-21: "combine on invoice" wins over "merge on invoice" for a parameter-priced panel:
     * one line, qty 1, parameters summed.
     */
    public function test_combine_wins_over_merge_for_panels(): void
    {
        $invoice = $this->makeInvoice();
        $acceptance = $this->makeAcceptance($invoice);
        $panel = $this->makeTest('PGT Panel', 'PGTP', TestType::PANEL, canMerge: true, extra: $this->pricing('noEmbryos', combine: true));
        $child = $this->makeMethod($panel, 0);
        $this->addItem($acceptance, $panel, price: 800, panelId: 601, customParameters: ['price' => ['noEmbryos' => '4']], method: $child);
        $this->addItem($acceptance, $panel, price: 600, panelId: 602, customParameters: ['price' => ['noEmbryos' => '3']], method: $child);

        $this->assertSame(1, $this->composer->recompose($invoice));
        $line = $invoice->invoiceItems()->firstOrFail();
        $this->assertSame(1, $line->qty);
        $this->assertSame('No Embryos=7', $line->description);
    }

    // --- helpers ---------------------------------------------------------

    /** @return array<string, mixed> */
    private function pricing(string $parameter, bool $combine): array
    {
        return array_filter([
            'parameters' => [['id' => 'p1', 'value' => $parameter]],
            'formula' => "190*{$parameter}",
            'combine_on_invoice' => $combine ?: null,
        ]);
    }

    private function makeReferrer(): Referrer
    {
        return Referrer::create([
            'fullName' => 'Combine Referrer',
            'phoneNo' => '90000010',
            'billingInfo' => [],
            'email' => 'combine-referrer@example.com',
            'reportReceivers' => [],
        ]);
    }

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

    private function makeAcceptance(Invoice $invoice, ?Referrer $referrer = null): Acceptance
    {
        return Acceptance::create([
            'referrer_id' => $referrer?->id,
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

    private function makeTest(string $name, string $code, TestType $type = TestType::TEST, bool $canMerge = false, ?array $extra = null): Test
    {
        return Test::create([
            'name' => $name,
            'fullName' => $name,
            'code' => $code,
            'type' => $type,
            'status' => true,
            'can_merge' => $canMerge,
            'extra' => $extra,
        ]);
    }

    private function makeMethod(Test $test, float $price, ?array $extra = null, ?array $referrerExtra = null): MethodTest
    {
        $method = Method::create([
            'name' => 'M-' . $test->code,
            'price' => $price,
            'status' => true,
            'no_patient' => 1,
            'no_sample' => 1,
            'extra' => $extra,
            'referrer_extra' => $referrerExtra,
        ]);

        return MethodTest::create([
            'method_id' => $method->id,
            'test_id' => $test->id,
            'is_default' => true,
            'status' => true,
        ]);
    }

    private function addItem(
        Acceptance $acceptance,
        Test $test,
        float $price,
        float $discount = 0,
        ?int $panelId = null,
        ?array $methodExtra = null,
        ?array $customParameters = null,
        ?MethodTest $method = null,
    ): AcceptanceItem {
        $methodTest = $method ?? $this->makeMethod($test, $price, $methodExtra);

        return AcceptanceItem::create([
            'acceptance_id' => $acceptance->id,
            'method_test_id' => $methodTest->id,
            'price' => $price,
            'discount' => $discount,
            'panel_id' => $panelId,
            'customParameters' => $customParameters,
        ]);
    }
}
