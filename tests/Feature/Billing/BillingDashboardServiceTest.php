<?php

namespace Tests\Feature\Billing;

use App\Domains\Billing\Enums\InvoiceItemKind;
use App\Domains\Billing\Enums\InvoiceStatus;
use App\Domains\Billing\Enums\PaymentMethod;
use App\Domains\Billing\Models\Invoice;
use App\Domains\Billing\Models\InvoiceItem;
use App\Domains\Billing\Models\Payment;
use App\Domains\Billing\Services\BillingDashboardService;
use App\Domains\Laboratory\Enums\TestType;
use App\Domains\Laboratory\Models\Method;
use App\Domains\Laboratory\Models\MethodTest;
use App\Domains\Laboratory\Models\Test;
use App\Domains\Reception\Enums\AcceptanceStatus;
use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Models\AcceptanceItem;
use App\Domains\Reception\Models\Patient;
use App\Domains\Reception\Services\AcceptanceService;
use App\Domains\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BillingDashboardServiceTest extends TestCase
{
    use RefreshDatabase;

    private BillingDashboardService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->actingAs(User::factory()->create());
        $this->service = new BillingDashboardService();
    }

    // ── resolveDates (pure) ──────────────────────────────────────────────────────

    public function test_resolve_dates_today_preset(): void
    {
        [$from, $to] = $this->service->resolveDates(['preset' => 'today']);
        $this->assertTrue($from->isStartOfDay());
        $this->assertSame($from->toDateString(), $to->toDateString());
    }

    public function test_resolve_dates_this_year_preset(): void
    {
        [$from, $to] = $this->service->resolveDates(['preset' => 'this_year']);
        $this->assertSame(1, $from->month);
        $this->assertSame(12, $to->month);
    }

    public function test_resolve_dates_explicit_range(): void
    {
        [$from, $to] = $this->service->resolveDates(['from' => '2026-02-01', 'to' => '2026-02-28']);
        $this->assertSame('2026-02-01', $from->toDateString());
        $this->assertSame('2026-02-28', $to->toDateString());
    }

    public function test_resolve_dates_default_last_30_days(): void
    {
        [$from, $to] = $this->service->resolveDates([]);
        $this->assertSame(30, (int) round($from->diffInDays($to)));
    }

    // ── Aggregations (real DB) ───────────────────────────────────────────────────

    public function test_get_summary_counts_non_invoiced_revenue(): void
    {
        $this->makeNonInvoicedItem(price: 100, discount: 10);

        $summary = $this->service->getSummary([]);

        $this->assertEqualsWithDelta(90.0, $summary['revenue'], 0.001);
        $this->assertEqualsWithDelta(0.0, $summary['collected'], 0.001);
        $this->assertEqualsWithDelta(90.0, $summary['outstanding'], 0.001);
        $this->assertSame(1, $summary['acceptance_count']);
        $this->assertSame(0, $summary['invoice_count']);
    }

    public function test_get_summary_zero_when_no_data(): void
    {
        $summary = $this->service->getSummary([]);
        $this->assertEqualsWithDelta(0.0, $summary['revenue'], 0.001);
        $this->assertSame(0, $summary['acceptance_count']);
    }

    public function test_get_by_month_returns_array(): void
    {
        $this->makeNonInvoicedItem();
        $this->assertIsArray($this->service->getByMonth([]));
    }

    public function test_get_by_test_returns_rows_for_present_data(): void
    {
        $this->makeNonInvoicedItem();
        $result = $this->service->getByTest([]);
        $this->assertIsArray($result);
        $this->assertNotEmpty($result);
    }

    public function test_get_by_referrer_returns_array(): void
    {
        $this->makeNonInvoicedItem();
        $this->assertIsArray($this->service->getByReferrer([]));
    }

    public function test_get_by_payment_method_returns_array(): void
    {
        $this->makeNonInvoicedItem();
        $this->assertIsArray($this->service->getByPaymentMethod([]));
    }

    // ── Cancelled invoices ───────────────────────────────────────────────────────
    // A cancelled invoice bills nobody: it must drop out of revenue, out of the
    // invoice/acceptance counts, and out of collected — the last one otherwise
    // drives outstanding (revenue − collected) negative.

    public function test_get_summary_counts_an_invoiced_acceptance(): void
    {
        $this->makeInvoicedItem(price: 100, discount: 10, paid: 40);

        $summary = $this->service->getSummary([]);

        $this->assertEqualsWithDelta(90.0, $summary['revenue'], 0.001);
        $this->assertEqualsWithDelta(40.0, $summary['collected'], 0.001);
        $this->assertSame(1, $summary['acceptance_count']);
        $this->assertSame(1, $summary['invoice_count']);
    }

    public function test_get_summary_ignores_a_cancelled_invoice(): void
    {
        $invoice = $this->makeInvoicedItem(price: 100, discount: 10, paid: 40);
        $invoice->update(['status' => InvoiceStatus::CANCELED]);

        $summary = $this->service->getSummary([]);

        $this->assertEqualsWithDelta(0.0, $summary['revenue'], 0.001);
        $this->assertEqualsWithDelta(0.0, $summary['collected'], 0.001);
        $this->assertEqualsWithDelta(0.0, $summary['outstanding'], 0.001);
        $this->assertSame(0, $summary['acceptance_count']);
        $this->assertSame(0, $summary['invoice_count']);
    }

    public function test_a_cancelled_invoice_drops_out_of_the_charts(): void
    {
        $invoice = $this->makeInvoicedItem(price: 100, paid: 40);

        $this->assertNotEmpty($this->service->getByTest([]));
        $this->assertNotEmpty($this->service->getByPaymentMethod([]));

        $invoice->update(['status' => InvoiceStatus::CANCELED]);

        $this->assertSame([], $this->service->getByTest([]));
        $this->assertSame([], $this->service->getByReferrer([]));
        $this->assertSame([], $this->service->getByPaymentMethod([]));
        $this->assertEqualsWithDelta(
            0.0,
            collect($this->service->getByMonth([]))->sum('invoiced_income'),
            0.001
        );
    }

    // Deleting an acceptance cancels its invoice, which is what keeps the
    // deleted acceptance out of the dashboard on the invoiced side.
    public function test_deleting_an_acceptance_takes_it_out_of_the_dashboard(): void
    {
        $invoice = $this->makeInvoicedItem(price: 100, paid: 40);
        $acceptance = Acceptance::where('invoice_id', $invoice->id)->firstOrFail();

        app(AcceptanceService::class)->deleteAcceptance($acceptance);

        $summary = $this->service->getSummary([]);
        $this->assertEqualsWithDelta(0.0, $summary['revenue'], 0.001);
        $this->assertEqualsWithDelta(0.0, $summary['collected'], 0.001);
        $this->assertSame(0, $summary['acceptance_count']);
    }

    /**
     * An acceptance whose items are invoiced, with an optional payment against
     * the invoice. Returns the invoice.
     */
    private function makeInvoicedItem(float $price = 50, float $discount = 0, float $paid = 0): Invoice
    {
        $item = $this->makeNonInvoicedItem($price, $discount);
        $acceptance = $item->acceptance;

        $invoice = Invoice::create([
            'owner_id' => $acceptance->patient_id,
            'owner_type' => Patient::class,
            'user_id' => auth()->id(),
            'status' => InvoiceStatus::WAITING_FOR_PAYMENT,
            'discount' => 0,
        ]);

        $invoiceItem = InvoiceItem::create([
            'invoice_id' => $invoice->id,
            'acceptance_id' => $acceptance->id,
            'test_id' => $item->methodTest->test_id,
            'kind' => InvoiceItemKind::TEST,
            'title' => 'Test line',
            'unit_price' => $price,
            'qty' => 1,
            'price' => $price,
            'discount' => $discount,
        ]);

        $item->update(['invoice_item_id' => $invoiceItem->id]);
        $acceptance->update(['invoice_id' => $invoice->id, 'status' => AcceptanceStatus::PROCESSING]);

        if ($paid > 0) {
            Payment::create([
                'invoice_id' => $invoice->id,
                'price' => $paid,
                'paymentMethod' => PaymentMethod::CASH,
                'cashier_id' => auth()->id(),
                'payer_type' => Patient::class,
                'payer_id' => $acceptance->patient_id,
            ]);
        }

        return $invoice;
    }

    private function makeNonInvoicedItem(float $price = 50, float $discount = 0): AcceptanceItem
    {
        $patient = Patient::create([
            'fullName'     => 'Dash Patient',
            'idNo'         => 'DASH' . uniqid(),
            'nationality'  => 'OM',
            'dateOfBirth'  => '1990-01-01',
            'gender'       => 'male',
            'registrar_id' => auth()->id(),
        ]);

        $acceptance = Acceptance::create([
            'status'              => AcceptanceStatus::PENDING,
            'step'                => 5,
            'patient_id'          => $patient->id,
            'acceptor_id'         => auth()->id(),
            'financial_approved'  => false,
            'out_patient'         => false,
            'waiting_for_pooling' => false,
            'invoice_id'          => null,
        ]);

        $test = Test::create(['name' => 'D', 'fullName' => 'D', 'code' => 'D' . uniqid(), 'type' => TestType::TEST, 'status' => true, 'can_merge' => false]);
        $method = Method::create(['name' => 'M', 'price' => 0, 'turnaround_time' => 1, 'status' => true, 'no_patient' => 1, 'no_sample' => 1]);
        $methodTest = MethodTest::create(['method_id' => $method->id, 'test_id' => $test->id, 'is_default' => true, 'status' => true]);

        return AcceptanceItem::create([
            'acceptance_id'    => $acceptance->id,
            'method_test_id'   => $methodTest->id,
            'price'            => $price,
            'discount'         => $discount,
            'reportless'       => false,
            'sampleless'       => false,
            'no_sample'        => 1,
            'customParameters' => [],
            'timeline'         => [],
        ]);
    }
}
