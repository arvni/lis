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
        $this->assertStringContainsString('Cash Patient', $data[0]['patient_name']);
    }

    public function test_excludes_service_type_items(): void
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

        $this->assertSame([], $this->service->buildReportData(Carbon::now()));
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

        Payment::create([
            'invoice_id'    => $invoice->id,
            'price'         => 40,
            'paymentMethod' => PaymentMethod::CASH,
            'cashier_id'    => auth()->id(),
            'payer_type'    => Patient::class,
            'payer_id'      => $this->patient->id,
        ]);

        $this->assertCount(1, $this->service->buildReportData(Carbon::now()));

        $invoice->update(['status' => InvoiceStatus::CANCELED]);

        $this->assertSame([], $this->service->buildReportData(Carbon::now()));
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
