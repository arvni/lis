<?php

namespace Tests\Unit\Billing;

use App\Domains\Billing\Enums\InvoiceItemKind;
use App\Domains\Billing\Enums\InvoiceStatus;
use App\Domains\Billing\Models\Invoice;
use App\Domains\Billing\Models\InvoiceItem;
use App\Domains\Billing\Services\InvoiceComposer;
use App\Domains\Laboratory\Enums\TestType;
use App\Domains\Laboratory\Models\Test;
use App\Domains\Reception\Models\AcceptanceItem;
use ReflectionMethod;
use Tests\TestCase;

/**
 * Pure-logic coverage for InvoiceComposer's bucketing/keying/payload helpers.
 *
 * The DB-bound recompose() orchestration is covered by the Feature test
 * (tests/Feature/Billing/InvoiceComposerTest.php). This unit test pins the
 * leaf decision functions — lock detection, bucket keys, panel-vs-test payload
 * math, and the defensive customParameters handling — via reflection with no
 * database, so the exact grouping/pricing rules are regression-guarded.
 */
class InvoiceComposerTest extends TestCase
{
    private InvoiceComposer $composer;

    protected function setUp(): void
    {
        parent::setUp();
        $this->composer = app(InvoiceComposer::class);
    }

    /** @param mixed ...$args */
    private function invoke(string $method, ...$args): mixed
    {
        $ref = new ReflectionMethod(InvoiceComposer::class, $method);
        $ref->setAccessible(true);

        return $ref->invoke($this->composer, ...$args);
    }

    // ---------------------------------------------------------------------
    // isLocked — statemented or settled invoices are not recomposed.
    // ---------------------------------------------------------------------

    public function test_is_locked_true_when_statemented(): void
    {
        $invoice = new Invoice;
        $invoice->statement_id = 42;
        $invoice->status = InvoiceStatus::WAITING_FOR_PAYMENT;

        $this->assertTrue($this->invoke('isLocked', $invoice));
    }

    public function test_is_locked_true_for_settled_statuses(): void
    {
        foreach ([InvoiceStatus::PAID, InvoiceStatus::CREDIT_PAID, InvoiceStatus::CANCELED] as $status) {
            $invoice = new Invoice;
            $invoice->status = $status;

            $this->assertTrue($this->invoke('isLocked', $invoice), "$status->value should lock");
        }
    }

    public function test_is_locked_false_for_open_invoice(): void
    {
        $invoice = new Invoice;
        $invoice->status = InvoiceStatus::WAITING_FOR_PAYMENT;

        $this->assertFalse($this->invoke('isLocked', $invoice));

        $partial = new Invoice;
        $partial->status = InvoiceStatus::PARTIALLY_PAID;

        $this->assertFalse($this->invoke('isLocked', $partial));
    }

    // ---------------------------------------------------------------------
    // kindFor — a panel_id + PANEL-typed test is a PANEL, everything else TEST.
    // ---------------------------------------------------------------------

    public function test_kind_for_panel_requires_panel_id_and_panel_type(): void
    {
        $panelTest = new Test(['type' => TestType::PANEL]);
        $regularTest = new Test(['type' => TestType::TEST]);

        $withPanel = new AcceptanceItem;
        $withPanel->panel_id = 7;
        $noPanel = new AcceptanceItem;
        $noPanel->panel_id = null;

        $this->assertSame(InvoiceItemKind::PANEL, $this->invoke('kindFor', $withPanel, $panelTest));
        // panel_id present but test isn't a PANEL type → TEST.
        $this->assertSame(InvoiceItemKind::TEST, $this->invoke('kindFor', $withPanel, $regularTest));
        // PANEL-typed test but no panel_id → TEST.
        $this->assertSame(InvoiceItemKind::TEST, $this->invoke('kindFor', $noPanel, $panelTest));
    }

    // ---------------------------------------------------------------------
    // keyForAcceptanceItem — panels merge per panel, mergeable tests per test,
    // everything else stays its own singleton line (scoped per acceptance).
    // ---------------------------------------------------------------------

    public function test_key_for_panel_item_groups_by_acceptance_and_panel(): void
    {
        $test = new Test(['type' => TestType::PANEL]);
        $test->id = 5;

        $ai = new AcceptanceItem;
        $ai->id = 99;
        $ai->acceptance_id = 3;
        $ai->panel_id = 8;

        $this->assertSame('panel:3:8', $this->invoke('keyForAcceptanceItem', $ai, $test));
    }

    public function test_key_for_mergeable_test_groups_by_acceptance_and_test(): void
    {
        $test = new Test(['type' => TestType::TEST, 'can_merge' => 1]);
        $test->id = 5;

        $ai = new AcceptanceItem;
        $ai->id = 99;
        $ai->acceptance_id = 3;
        $ai->panel_id = null;

        $this->assertSame('test:3:5', $this->invoke('keyForAcceptanceItem', $ai, $test));
    }

    public function test_key_for_non_mergeable_test_is_a_singleton(): void
    {
        $test = new Test(['type' => TestType::TEST, 'can_merge' => 0]);
        $test->id = 5;

        $ai = new AcceptanceItem;
        $ai->id = 99;
        $ai->acceptance_id = 3;
        $ai->panel_id = null;

        $this->assertSame('single:99', $this->invoke('keyForAcceptanceItem', $ai, $test));
    }

    // ---------------------------------------------------------------------
    // keyFor(InvoiceItem) — mirror of keyForAcceptanceItem so an existing row
    // matches the same bucket and updates in place instead of churning inserts.
    // ---------------------------------------------------------------------

    public function test_key_for_invoice_item_panel(): void
    {
        $item = new InvoiceItem;
        $item->kind = InvoiceItemKind::PANEL;
        $item->acceptance_id = 3;
        $item->panel_id = 8;

        $this->assertSame('panel:3:8', $this->invoke('keyFor', $item));
    }

    public function test_key_for_invoice_item_mergeable_test(): void
    {
        $item = new InvoiceItem;
        $item->kind = InvoiceItemKind::TEST;
        $item->acceptance_id = 3;
        $item->test_id = 5;
        $item->setRelation('test', new Test(['can_merge' => 1]));

        $this->assertSame('test:3:5', $this->invoke('keyFor', $item));
    }

    public function test_key_for_invoice_item_singleton_uses_first_acceptance_item(): void
    {
        $item = new InvoiceItem;
        $item->kind = InvoiceItemKind::TEST;
        $item->acceptance_id = 3;
        $item->test_id = 5;
        $item->setRelation('test', new Test(['can_merge' => 0]));
        $linked = new AcceptanceItem;
        $linked->id = 99;
        $item->setRelation('acceptanceItems', collect([$linked]));

        $this->assertSame('single:99', $this->invoke('keyFor', $item));
    }

    public function test_key_for_invoice_item_falls_back_to_item_id_without_links(): void
    {
        $item = new InvoiceItem;
        $item->id = 12;
        $item->kind = InvoiceItemKind::MANUAL_FEE;
        $item->setRelation('acceptanceItems', collect());

        $this->assertSame('item:12', $this->invoke('keyFor', $item));
    }

    // ---------------------------------------------------------------------
    // payloadFor — panel collapses to one row priced at the child sum;
    // tests keep per-item unit price with qty = count.
    // ---------------------------------------------------------------------

    public function test_payload_for_panel_is_single_qty_priced_at_child_sum(): void
    {
        $payload = $this->invoke('payloadFor', $this->bucket([
            'kind' => InvoiceItemKind::PANEL,
            'qty' => 3,
            'unit_price' => 40.0,
            'price_sum' => 120.0,
            'discount_sum' => 10.0,
            'panel_id' => 8,
        ]));

        $this->assertSame(InvoiceItemKind::PANEL, $payload['kind']);
        $this->assertSame(1, $payload['qty']);
        $this->assertSame(120.0, $payload['unit_price']);
        $this->assertSame(120.0, $payload['price']);
        $this->assertSame(10.0, $payload['discount']);
        $this->assertSame(8, $payload['panel_id']);
    }

    public function test_payload_for_test_keeps_unit_price_and_counted_qty(): void
    {
        $payload = $this->invoke('payloadFor', $this->bucket([
            'kind' => InvoiceItemKind::TEST,
            'qty' => 3,
            'unit_price' => 40.0,
            'price_sum' => 120.0,
            'discount_sum' => 0.0,
        ]));

        $this->assertSame(3, $payload['qty']);
        $this->assertSame(40.0, $payload['unit_price']);
        $this->assertSame(120.0, $payload['price']);
    }

    public function test_payload_for_null_description_when_no_custom_parameters(): void
    {
        $payload = $this->invoke('payloadFor', $this->bucket(['customParameters' => []]));

        $this->assertNull($payload['description']);
        $this->assertNull($payload['customParameters']);
    }

    public function test_payload_for_builds_description_from_price_parameters(): void
    {
        $payload = $this->invoke('payloadFor', $this->bucket([
            'customParameters' => ['price' => ['bloodVolume' => 5, 'ageInYears' => 30]],
        ]));

        $this->assertSame('Blood Volume=5, Age In Years=30', $payload['description']);
    }

    // ---------------------------------------------------------------------
    // descriptionFor — camelCase price params → "Human Label=value" list.
    // ---------------------------------------------------------------------

    public function test_description_for_empty_or_missing_price_is_blank(): void
    {
        $this->assertSame('', $this->invoke('descriptionFor', null));
        $this->assertSame('', $this->invoke('descriptionFor', []));
        $this->assertSame('', $this->invoke('descriptionFor', ['price' => []]));
    }

    public function test_description_for_non_array_price_is_blank(): void
    {
        $this->assertSame('', $this->invoke('descriptionFor', ['price' => 'nonsense']));
    }

    // ---------------------------------------------------------------------
    // normalizeCustomParameters — defends against historical double-encoded JSON.
    // ---------------------------------------------------------------------

    public function test_normalize_custom_parameters_passes_arrays_through(): void
    {
        $this->assertSame(['a' => 1], $this->invoke('normalizeCustomParameters', ['a' => 1]));
    }

    public function test_normalize_custom_parameters_decodes_json_strings(): void
    {
        $this->assertSame(['a' => 1], $this->invoke('normalizeCustomParameters', '{"a":1}'));
    }

    public function test_normalize_custom_parameters_returns_empty_for_junk(): void
    {
        $this->assertSame([], $this->invoke('normalizeCustomParameters', 'not-json'));
        $this->assertSame([], $this->invoke('normalizeCustomParameters', ''));
        $this->assertSame([], $this->invoke('normalizeCustomParameters', null));
        $this->assertSame([], $this->invoke('normalizeCustomParameters', 42));
    }

    /**
     * Build a bucket array with sensible defaults, overridden per test.
     *
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function bucket(array $overrides = []): array
    {
        return array_merge([
            'key' => 'single:1',
            'kind' => InvoiceItemKind::TEST,
            'acceptance_id' => 1,
            'test_id' => 5,
            'panel_id' => null,
            'title' => 'CBC',
            'code' => 'T-1',
            'unit_price' => 40.0,
            'qty' => 1,
            'price_sum' => 40.0,
            'discount_sum' => 0.0,
            'customParameters' => [],
            'acceptance_item_ids' => [1],
        ], $overrides);
    }
}
