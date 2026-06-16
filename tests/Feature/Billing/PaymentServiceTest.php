<?php

namespace Tests\Feature\Billing;

use App\Domains\Billing\DTOs\PaymentDTO;
use App\Domains\Billing\Enums\InvoiceStatus;
use App\Domains\Billing\Enums\PaymentMethod;
use App\Domains\Billing\Events\PaymentsAddedEvent;
use App\Domains\Billing\Models\Invoice;
use App\Domains\Billing\Services\InvoiceComposer;
use App\Domains\Billing\Services\PaymentService;
use App\Domains\Laboratory\Enums\TestType;
use App\Domains\Laboratory\Models\Method;
use App\Domains\Laboratory\Models\MethodTest;
use App\Domains\Laboratory\Models\Test;
use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Models\AcceptanceItem;
use App\Domains\Reception\Models\Patient;
use App\Domains\Setting\Services\SettingService;
use App\Domains\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Mockery;
use Tests\TestCase;

class PaymentServiceTest extends TestCase
{
    use RefreshDatabase;

    private PaymentService $service;
    private User $cashier;
    private Patient $patient;
    private Invoice $invoice;
    private Acceptance $acceptance;
    private MethodTest $methodTest;

    protected function setUp(): void
    {
        parent::setUp();

        $settingMock = Mockery::mock(SettingService::class);
        $settingMock->shouldReceive('getSettingByKey')
            ->with('Payment', 'minPayment')
            ->andReturn(50);
        $this->app->instance(SettingService::class, $settingMock);

        $this->cashier = User::factory()->create();
        $this->patient = Patient::create([
            'fullName' => 'Payer Patient',
            'idNo' => 'PAY001',
            'nationality' => 'OM',
            'dateOfBirth' => '1985-06-15',
            'gender' => 'male',
            'registrar_id' => $this->cashier->id,
        ]);

        $this->invoice = Invoice::create([
            'owner_type' => 'patient',
            'owner_id' => $this->patient->id,
            'user_id' => $this->cashier->id,
            'status' => InvoiceStatus::WAITING_FOR_PAYMENT,
            'discount' => 0,
        ]);

        $this->acceptance = Acceptance::create([
            'patient_id' => $this->patient->id,
            'invoice_id' => $this->invoice->id,
            'acceptor_id' => $this->cashier->id,
            'status' => 'pending',
            'step' => 1,
            'financial_approved' => false,
            'out_patient' => false,
            'waiting_for_pooling' => false,
        ]);

        $method = Method::create(['name' => 'Test Method', 'price' => 200, 'status' => true, 'no_patient' => 1, 'no_sample' => 1]);
        $test = Test::create(['name' => 'Blood Test', 'fullName' => 'Blood Test', 'code' => 'BT01', 'type' => TestType::TEST, 'status' => true, 'can_merge' => false]);
        $this->methodTest = MethodTest::create(['method_id' => $method->id, 'test_id' => $test->id, 'is_default' => true, 'status' => true]);

        AcceptanceItem::create([
            'acceptance_id' => $this->acceptance->id,
            'method_test_id' => $this->methodTest->id,
            'price' => 200,
            'discount' => 0,
        ]);

        // Invoice status is derived from invoice_items totals (totalAmount sums invoice_items),
        // so compose them from the acceptance item — otherwise the payable total is 0 and any
        // payment reads as fully paid.
        app(InvoiceComposer::class)->recompose($this->invoice);

        $this->service = app(PaymentService::class);
    }

    private function makeDto(float $price, PaymentMethod $method = PaymentMethod::CASH): PaymentDTO
    {
        return new PaymentDTO(
            invoiceId: $this->invoice->id,
            cashierId: $this->cashier->id,
            payerType: 'patient',
            payerId: $this->patient->id,
            price: $price,
            paymentMethod: $method,
            information: null,
        );
    }

    /**
     * B-02: A payment equal to the invoice total marks the invoice as PAID.
     */
    public function test_store_payment_full_amount_sets_invoice_paid(): void
    {
        $this->service->storePayment($this->makeDto(200));

        $this->assertDatabaseHas('invoices', [
            'id' => $this->invoice->id,
            'status' => InvoiceStatus::PAID->value,
        ]);
    }

    /**
     * B-03: A payment via CREDIT method marks the invoice as CREDIT_PAID.
     */
    public function test_store_payment_with_credit_method_sets_credit_paid(): void
    {
        $this->service->storePayment($this->makeDto(200, PaymentMethod::CREDIT));

        $this->assertDatabaseHas('invoices', [
            'id' => $this->invoice->id,
            'status' => InvoiceStatus::CREDIT_PAID->value,
        ]);
    }

    /**
     * B-04: A partial payment leaves the invoice in PARTIALLY_PAID status.
     */
    public function test_store_payment_partial_amount_stays_partially_paid(): void
    {
        $this->service->storePayment($this->makeDto(50));

        $this->assertDatabaseHas('invoices', [
            'id' => $this->invoice->id,
            'status' => InvoiceStatus::PARTIALLY_PAID->value,
        ]);
    }

    /**
     * B-05: PaymentsAddedEvent is dispatched when totalPaid * minPayment% / 100 >= payable.
     *
     * minPayment = 50 %, payable = 200. Threshold = 200 / 50 * 100 = 400 paid needed?
     * Re-reading: (totalPaid * 50 / 100) >= 200  =>  totalPaid >= 400. That cannot be met with price=200 items.
     * Actual formula: totalPaid * minPayment% / 100 >= payable
     * With minPayment=50 and payable=200: totalPaid >= 400.
     *
     * To trigger the event we need totalPaid * 50 / 100 >= 200, i.e. totalPaid >= 400.
     * We pay 400 (adding two payments of 200 each).
     */
    public function test_store_payment_dispatches_payments_added_event_when_threshold_met(): void
    {
        Event::fake();

        $this->service->storePayment($this->makeDto(200));
        $this->service->storePayment($this->makeDto(200));

        Event::assertDispatched(PaymentsAddedEvent::class, function (PaymentsAddedEvent $event) {
            return $event->acceptanceId === $this->acceptance->id;
        });
    }

    /**
     * B-06: PaymentsAddedEvent is NOT dispatched when payment is below the threshold.
     *
     * minPayment=50, payable=200. Need totalPaid >= 400 to dispatch. Paying only 100 stays below.
     */
    public function test_store_payment_does_not_dispatch_event_below_threshold(): void
    {
        Event::fake();

        $this->service->storePayment($this->makeDto(100));

        Event::assertNotDispatched(PaymentsAddedEvent::class);
    }

    /**
     * B-07: Deleting the only payment reverts the invoice back to WAITING_FOR_PAYMENT.
     */
    public function test_delete_payment_reverts_invoice_to_waiting_for_payment(): void
    {
        $payment = $this->service->storePayment($this->makeDto(200));

        $this->assertDatabaseHas('invoices', [
            'id' => $this->invoice->id,
            'status' => InvoiceStatus::PAID->value,
        ]);

        $this->service->deletePayment($payment);

        $this->assertDatabaseHas('invoices', [
            'id' => $this->invoice->id,
            'status' => InvoiceStatus::WAITING_FOR_PAYMENT->value,
        ]);
    }

    /**
     * B-08: Reducing a payment amount drops the invoice from PAID to PARTIALLY_PAID.
     */
    public function test_update_payment_recalculates_invoice_status(): void
    {
        $payment = $this->service->storePayment($this->makeDto(200));

        $this->assertDatabaseHas('invoices', [
            'id' => $this->invoice->id,
            'status' => InvoiceStatus::PAID->value,
        ]);

        $reducedDto = $this->makeDto(50);

        $this->service->updatePayment($payment, $reducedDto);

        $this->assertDatabaseHas('invoices', [
            'id' => $this->invoice->id,
            'status' => InvoiceStatus::PARTIALLY_PAID->value,
        ]);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }
}
