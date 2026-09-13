<?php

declare(strict_types=1);

namespace Tests\Feature\Reception;

use App\Domains\Billing\Enums\InvoiceItemKind;
use App\Domains\Billing\Enums\InvoiceStatus;
use App\Domains\Billing\Enums\PaymentMethod;
use App\Domains\Billing\Models\Invoice;
use App\Domains\Billing\Models\InvoiceItem;
use App\Domains\Billing\Models\Payment;
use App\Domains\Reception\Adapters\BillingAdapter;
use App\Domains\Reception\Models\Patient;
use App\Domains\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * isInvoiceFullyPaid is what financial approval asks Billing before releasing an
 * acceptance, so it must agree with the rule that marks an invoice PAID.
 */
class BillingAdapterTest extends TestCase
{
    use RefreshDatabase;

    private BillingAdapter $adapter;

    private Patient $patient;

    protected function setUp(): void
    {
        parent::setUp();
        $this->actingAs(User::factory()->create());
        $this->adapter = app(BillingAdapter::class);

        $this->patient = Patient::create([
            'fullName' => 'Adapter Patient',
            'idNo' => 'ADP'.uniqid(),
            'nationality' => 'OM',
            'dateOfBirth' => '1990-01-01',
            'gender' => 'male',
            'registrar_id' => auth()->id(),
        ]);
    }

    public function test_an_invoice_paid_in_full_is_fully_paid(): void
    {
        $invoice = $this->makeInvoice(price: 50);
        $this->pay($invoice, 50);

        $this->assertTrue($this->adapter->isInvoiceFullyPaid($invoice->id));
    }

    public function test_an_invoice_with_a_balance_owing_is_not_fully_paid(): void
    {
        $invoice = $this->makeInvoice(price: 50);
        $this->pay($invoice, 49.999);

        $this->assertFalse($this->adapter->isInvoiceFullyPaid($invoice->id));
    }

    public function test_an_unpaid_invoice_is_not_fully_paid(): void
    {
        $this->assertFalse($this->adapter->isInvoiceFullyPaid($this->makeInvoice(price: 50)->id));
    }

    public function test_line_discounts_come_off_what_is_owed(): void
    {
        $invoice = $this->makeInvoice(price: 50, discount: 10);
        $this->pay($invoice, 40);

        $this->assertTrue($this->adapter->isInvoiceFullyPaid($invoice->id));
    }

    // Billing records a credit payment as CREDIT_PAID — the invoice is settled.
    public function test_a_credit_payment_counts_towards_being_fully_paid(): void
    {
        $invoice = $this->makeInvoice(price: 50);
        $this->pay($invoice, 50, PaymentMethod::CREDIT);

        $this->assertTrue($this->adapter->isInvoiceFullyPaid($invoice->id));
    }

    public function test_a_payment_split_across_methods_adds_up(): void
    {
        $invoice = $this->makeInvoice(price: 50);
        $this->pay($invoice, 30);
        $this->pay($invoice, 20, PaymentMethod::CARD);

        $this->assertTrue($this->adapter->isInvoiceFullyPaid($invoice->id));
    }

    public function test_a_missing_invoice_is_not_fully_paid(): void
    {
        $this->assertFalse($this->adapter->isInvoiceFullyPaid(999999));
    }

    private function makeInvoice(float $price, float $discount = 0): Invoice
    {
        $invoice = Invoice::create([
            'owner_type' => 'patient',
            'owner_id' => $this->patient->id,
            'user_id' => auth()->id(),
            'status' => InvoiceStatus::WAITING_FOR_PAYMENT,
            'discount' => 0,
        ]);

        InvoiceItem::create([
            'invoice_id' => $invoice->id,
            'kind' => InvoiceItemKind::TEST,
            'title' => 'Test line',
            'unit_price' => $price,
            'qty' => 1,
            'price' => $price,
            'discount' => $discount,
        ]);

        return $invoice;
    }

    private function pay(Invoice $invoice, float $amount, PaymentMethod $method = PaymentMethod::CASH): void
    {
        Payment::create([
            'invoice_id' => $invoice->id,
            'price' => $amount,
            'paymentMethod' => $method,
            'cashier_id' => auth()->id(),
            'payer_type' => Patient::class,
            'payer_id' => $this->patient->id,
        ]);
    }
}
