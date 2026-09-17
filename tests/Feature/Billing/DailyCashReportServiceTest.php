<?php

namespace Tests\Feature\Billing;

use App\Domains\Laboratory\Enums\TestType;
use App\Domains\Laboratory\Models\Method;
use App\Domains\Laboratory\Models\MethodTest;
use App\Domains\Laboratory\Models\Test;
use App\Domains\Billing\Enums\InvoiceStatus;
use App\Domains\Billing\Enums\PaymentMethod;
use App\Domains\Billing\Models\Invoice;
use App\Domains\Billing\Models\Payment;
use App\Domains\Billing\Services\DailyCashReportService;
use App\Domains\Reception\Enums\AcceptanceStatus;
use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Models\AcceptanceItem;
use App\Domains\Reception\Models\Patient;
use App\Domains\Reception\Services\AcceptanceService;
use App\Domains\User\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DailyCashReportServiceTest extends TestCase
{
    use RefreshDatabase;

    private DailyCashReportService $service;
    private Patient $patient;

    protected function setUp(): void
    {
        parent::setUp();
        $this->actingAs(User::factory()->create());
        $this->service = app(DailyCashReportService::class);

        $this->patient = Patient::create([
            'fullName'     => 'Cash Patient',
            'idNo'         => 'CASH001',
            'nationality'  => 'OM',
            'dateOfBirth'  => '1990-01-01',
            'gender'       => 'male',
            'registrar_id' => auth()->id(),
        ]);
    }

    public function test_returns_empty_when_no_activity_for_date(): void
    {
        $this->assertSame([], $this->service->buildReportData(Carbon::now()));
    }

    public function test_builds_row_from_acceptance_items(): void
    {
        $acceptance = Acceptance::create([
            'status'              => AcceptanceStatus::PENDING,
            'step'                => 5,
            'patient_id'          => $this->patient->id,
            'acceptor_id'         => auth()->id(),
            'financial_approved'  => false,
            'out_patient'         => false,
            'waiting_for_pooling' => false,
        ]);

        AcceptanceItem::create([
            'acceptance_id'    => $acceptance->id,
            'method_test_id'   => $this->makeMethodTest(),
            'price'            => 100,
            'discount'         => 10,
            'reportless'       => false,
            'sampleless'       => false,
            'no_sample'        => 1,
            'customParameters' => [],
            'timeline'         => [],
        ]);

        $data = $this->service->buildReportData(Carbon::now());

        $this->assertCount(1, $data);
        $this->assertEqualsWithDelta(100.0, $data[0]['test_price'], 0.001);
        $this->assertEqualsWithDelta(10.0, $data[0]['discount'], 0.001);
        $this->assertEqualsWithDelta(90.0, $data[0]['remaining'], 0.001);
        // Nothing was collected, so the day's takings are zero.
        $this->assertEqualsWithDelta(0.0, $data[0]['prepayment'], 0.001);
        $this->assertStringContainsString('Cash Patient', $data[0]['patient_name']);
    }

    public function test_includes_service_type_items(): void
    {
        $acceptance = Acceptance::create([
            'status'              => AcceptanceStatus::PENDING,
            'step'                => 5,
            'patient_id'          => $this->patient->id,
            'acceptor_id'         => auth()->id(),
            'financial_approved'  => false,
            'out_patient'         => false,
            'waiting_for_pooling' => false,
        ]);

        AcceptanceItem::create([
            'acceptance_id'    => $acceptance->id,
            'method_test_id'   => $this->makeMethodTest(TestType::SERVICE),
            'price'            => 100,
            'discount'         => 0,
            'reportless'       => false,
            'sampleless'       => false,
            'no_sample'        => 1,
            'customParameters' => [],
            'timeline'         => [],
        ]);

        $data = $this->service->buildReportData(Carbon::now());

        // A service-only acceptance is real billable activity — it gets a row.
        $this->assertCount(1, $data);
        $this->assertEqualsWithDelta(100.0, $data[0]['test_price'], 0.001);
        $this->assertEqualsWithDelta(100.0, $data[0]['remaining'], 0.001);
    }

    // ── Cancelled invoices ───────────────────────────────────────────────────────
    // Same rule as the billing dashboard: a cancelled invoice is not takings, so
    // neither its acceptance's tests nor its payments reach the report.

    public function test_drops_a_row_whose_invoice_was_cancelled(): void
    {
        [$acceptance, $invoice] = $this->makeInvoicedAcceptance();

        $this->assertCount(1, $this->service->buildReportData(Carbon::now()));

        $invoice->update(['status' => InvoiceStatus::CANCELED]);

        $this->assertSame([], $this->service->buildReportData(Carbon::now()));
    }

    // The payment feed picks up acceptances whose items were registered on an
    // earlier day, so it needs the guard of its own.
    public function test_drops_a_payment_whose_invoice_was_cancelled(): void
    {
        [$acceptance, $invoice] = $this->makeInvoicedAcceptance(itemsCreatedAt: Carbon::now()->subDays(3));

        $this->makePayment($invoice, PaymentMethod::CASH, 40);

        $this->assertCount(1, $this->service->buildReportData(Carbon::now()));

        $invoice->update(['status' => InvoiceStatus::CANCELED]);

        $this->assertSame([], $this->service->buildReportData(Carbon::now()));
    }

    // ── Date-scoped takings ──────────────────────────────────────────────────────

    // The reported bug: an acceptance registered days earlier and settled today
    // reported its whole settled amount as today's cash.
    public function test_counts_only_the_money_collected_on_the_report_date(): void
    {
        [$acceptance, $invoice] = $this->makeInvoicedAcceptance(itemsCreatedAt: Carbon::now()->subDays(3));

        $this->makePayment($invoice, PaymentMethod::CASH, 40, Carbon::now()->subDays(3));
        $this->makePayment($invoice, PaymentMethod::CASH, 25);

        $data = $this->service->buildReportData(Carbon::now());

        $this->assertCount(1, $data);
        // 25 landed today; the 40 taken three days ago belongs to that day's report.
        $this->assertEqualsWithDelta(25.0, $data[0]['prepayment'], 0.001);
        // Nothing was booked today, so the row is pure collection: it only draws down
        // what was outstanding, which is what keeps the daily totals additive.
        $this->assertEqualsWithDelta(0.0, $data[0]['test_price'], 0.001);
        $this->assertEqualsWithDelta(-25.0, $data[0]['remaining'], 0.001);
    }

    public function test_scopes_each_days_row_to_that_days_items(): void
    {
        [$acceptance] = $this->makeInvoicedAcceptance(itemsCreatedAt: Carbon::now()->subDay());

        // A second item booked today, on the same acceptance.
        AcceptanceItem::create([
            'acceptance_id'    => $acceptance->id,
            'method_test_id'   => $this->makeMethodTest(),
            'price'            => 50,
            'discount'         => 0,
            'reportless'       => false,
            'sampleless'       => false,
            'no_sample'        => 1,
            'customParameters' => [],
            'timeline'         => [],
        ]);

        $today = $this->service->buildReportData(Carbon::now());
        $yesterday = $this->service->buildReportData(Carbon::now()->subDay());

        // Each day carries only its own billing — 50 today, 100/10 yesterday — so the
        // two reports add up to the acceptance instead of repeating it twice.
        $this->assertCount(1, $today);
        $this->assertEqualsWithDelta(50.0, $today[0]['test_price'], 0.001);
        $this->assertEqualsWithDelta(0.0, $today[0]['discount'], 0.001);

        $this->assertCount(1, $yesterday);
        $this->assertEqualsWithDelta(100.0, $yesterday[0]['test_price'], 0.001);
        $this->assertEqualsWithDelta(10.0, $yesterday[0]['discount'], 0.001);
    }

    public function test_sums_a_split_cash_and_card_day_into_takings(): void
    {
        [$acceptance, $invoice] = $this->makeInvoicedAcceptance();

        $this->makePayment($invoice, PaymentMethod::CASH, 30);
        $this->makePayment($invoice, PaymentMethod::CARD, 20);

        $data = $this->service->buildReportData(Carbon::now());

        $this->assertCount(1, $data);
        $this->assertSame('CASH, CARD', $data[0]['payment_method']);
        $this->assertEqualsWithDelta(50.0, $data[0]['prepayment'], 0.001);
        $this->assertEqualsWithDelta(50.0, $data[0]['paid_cash_card'], 0.001);
        $this->assertEqualsWithDelta(0.0, $data[0]['paid_transfer'], 0.001);
    }

    private function makePayment(Invoice $invoice, PaymentMethod $method, float $price, ?Carbon $at = null): Payment
    {
        $payment = Payment::create([
            'invoice_id'    => $invoice->id,
            'price'         => $price,
            'paymentMethod' => $method,
            'cashier_id'    => auth()->id(),
            'payer_type'    => Patient::class,
            'payer_id'      => $this->patient->id,
        ]);

        if ($at) {
            $payment->forceFill(['created_at' => $at])->save();
        }

        return $payment;
    }

    // Deleting an acceptance cancels its invoice, so both feeds drop it.
    public function test_drops_a_deleted_acceptance(): void
    {
        [$acceptance] = $this->makeInvoicedAcceptance();

        app(AcceptanceService::class)->deleteAcceptance($acceptance);

        $this->assertSame([], $this->service->buildReportData(Carbon::now()));
    }

    /**
     * An acceptance with one invoiced test item.
     *
     * @return array{0: Acceptance, 1: Invoice}
     */
    private function makeInvoicedAcceptance(?Carbon $itemsCreatedAt = null): array
    {
        $invoice = Invoice::create([
            'owner_id'   => $this->patient->id,
            'owner_type' => Patient::class,
            'user_id'    => auth()->id(),
            'status'     => InvoiceStatus::WAITING_FOR_PAYMENT,
            'discount'   => 0,
        ]);

        $acceptance = Acceptance::create([
            'status'              => AcceptanceStatus::PROCESSING,
            'step'                => 5,
            'patient_id'          => $this->patient->id,
            'acceptor_id'         => auth()->id(),
            'invoice_id'          => $invoice->id,
            'financial_approved'  => false,
            'out_patient'         => false,
            'waiting_for_pooling' => false,
        ]);

        $item = AcceptanceItem::create([
            'acceptance_id'    => $acceptance->id,
            'method_test_id'   => $this->makeMethodTest(),
            'price'            => 100,
            'discount'         => 10,
            'reportless'       => false,
            'sampleless'       => false,
            'no_sample'        => 1,
            'customParameters' => [],
            'timeline'         => [],
        ]);

        if ($itemsCreatedAt) {
            $item->forceFill(['created_at' => $itemsCreatedAt])->save();
        }

        return [$acceptance, $invoice];
    }

    private function makeMethodTest(TestType $type = TestType::TEST): int
    {
        $test = Test::create(['name' => 'C', 'fullName' => 'C', 'code' => 'C' . uniqid(), 'type' => $type, 'status' => true, 'can_merge' => false]);
        $method = Method::create(['name' => 'M', 'price' => 0, 'turnaround_time' => 1, 'status' => true, 'no_patient' => 1, 'no_sample' => 1]);
        return (int) MethodTest::create(['method_id' => $method->id, 'test_id' => $test->id, 'is_default' => true, 'status' => true])->id;
    }
}
