<?php

declare(strict_types=1);

namespace Tests\Feature\Reception;

use App\Domains\Billing\Enums\InvoiceItemKind;
use App\Domains\Billing\Enums\InvoiceStatus;
use App\Domains\Billing\Enums\PaymentMethod;
use App\Domains\Billing\Models\Invoice;
use App\Domains\Billing\Models\InvoiceItem;
use App\Domains\Billing\Models\Payment;
use App\Domains\Reception\Enums\AcceptanceStatus;
use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Models\Patient;
use App\Domains\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

/**
 * HTTP-level coverage for the financial-approval endpoint. The FinancialCheck
 * page's confirmation dialog shows the invoice and its payments, but that is
 * only a UI hint — these cover the server-side guards that actually keep an
 * uninvoiced or not fully paid acceptance out of publishing.
 */
class ApproveFinancialControllerTest extends TestCase
{
    use RefreshDatabase;

    private const PERMISSION = 'Report.Approve Financial';

    private Patient $patient;

    protected function setUp(): void
    {
        parent::setUp();
        $this->actingAs($this->userWithPermission());

        $this->patient = Patient::create([
            'fullName' => 'Finance Patient',
            'idNo' => 'FIN'.Str::random(6),
            'nationality' => 'OM',
            'dateOfBirth' => '1990-01-01',
            'gender' => 'male',
            'registrar_id' => auth()->id(),
        ]);
    }

    private function userWithPermission(): User
    {
        $user = User::factory()->create();
        Permission::findOrCreate(self::PERMISSION);
        $user->givePermissionTo(self::PERMISSION);
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return $user;
    }

    private function createInvoice(float $price = 50, float $discount = 0, ?float $paid = null): Invoice
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

        // Paid in full unless told otherwise.
        $paid ??= $price - $discount;
        if ($paid > 0) {
            Payment::create([
                'invoice_id' => $invoice->id,
                'price' => $paid,
                'paymentMethod' => PaymentMethod::CASH,
                'cashier_id' => auth()->id(),
                'payer_type' => Patient::class,
                'payer_id' => $this->patient->id,
            ]);
        }

        return $invoice;
    }

    private function createAcceptance(array $attributes = []): Acceptance
    {
        return Acceptance::create(array_merge([
            'status' => AcceptanceStatus::WAITING_FOR_FINANCIAL_APPROVAL,
            'step' => 5,
            'patient_id' => $this->patient->id,
            'acceptor_id' => auth()->id(),
            'financial_approved' => false,
            'out_patient' => false,
            'waiting_for_pooling' => false,
        ], $attributes));
    }

    public function test_approves_an_invoiced_acceptance(): void
    {
        $acceptance = $this->createAcceptance(['invoice_id' => $this->createInvoice()->id]);

        $this->put(route('acceptances.approveFinancial', $acceptance->id))
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $acceptance->refresh();
        $this->assertTrue((bool) $acceptance->financial_approved);
        $this->assertSame((int) auth()->id(), (int) $acceptance->financial_approved_by);
    }

    // Finance signs off on money received, so an invoice with a balance still
    // owing is refused with an error saying it needs to be fully paid.
    public function test_rejects_an_acceptance_whose_invoice_is_not_fully_paid(): void
    {
        $acceptance = $this->createAcceptance(['invoice_id' => $this->createInvoice(price: 50, paid: 20)->id]);

        $this->put(route('acceptances.approveFinancial', $acceptance->id))
            ->assertRedirect()
            ->assertSessionHasErrors(['message' => "Acceptance #{$acceptance->id}'s invoice is not fully paid; it needs to be fully paid before financial approval."]);

        $acceptance->refresh();
        $this->assertFalse((bool) $acceptance->financial_approved);
        $this->assertNull($acceptance->financial_approved_by);
        $this->assertSame(AcceptanceStatus::WAITING_FOR_FINANCIAL_APPROVAL, $acceptance->status);
    }

    // Acknowledging a missing invoice is not a way around an unpaid one.
    public function test_rejects_a_not_fully_paid_invoice_even_with_the_uninvoiced_acknowledgement(): void
    {
        $acceptance = $this->createAcceptance(['invoice_id' => $this->createInvoice(price: 50, paid: 0)->id]);

        $this->put(route('acceptances.approveFinancial', $acceptance->id), [
            'approve_without_invoice' => true,
        ])->assertRedirect()->assertSessionHasErrors('message');

        $acceptance->refresh();
        $this->assertFalse((bool) $acceptance->financial_approved);
    }

    // Fully paid means the lines' price less their discount.
    public function test_approves_a_discounted_invoice_paid_net_of_the_discount(): void
    {
        $acceptance = $this->createAcceptance(['invoice_id' => $this->createInvoice(price: 50, discount: 10, paid: 40)->id]);

        $this->put(route('acceptances.approveFinancial', $acceptance->id))
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $this->assertTrue((bool) $acceptance->refresh()->financial_approved);
    }

    // Without the dialog's acknowledgement an uninvoiced acceptance is refused —
    // it used to sail through and release the acceptance to publishing unbilled.
    public function test_rejects_an_uninvoiced_acceptance_that_was_not_confirmed(): void
    {
        $acceptance = $this->createAcceptance();

        $this->put(route('acceptances.approveFinancial', $acceptance->id))
            ->assertRedirect()
            ->assertSessionHasErrors('message');

        $acceptance->refresh();
        $this->assertFalse((bool) $acceptance->financial_approved);
        $this->assertNull($acceptance->financial_approved_by);
        $this->assertSame(AcceptanceStatus::WAITING_FOR_FINANCIAL_APPROVAL, $acceptance->status);
    }

    // The dialog shows the reviewer there is no invoice; confirming there sends
    // the acknowledgement that lets the approval through.
    public function test_approves_an_uninvoiced_acceptance_when_confirmed(): void
    {
        $acceptance = $this->createAcceptance();

        $this->put(route('acceptances.approveFinancial', $acceptance->id), [
            'approve_without_invoice' => true,
        ])->assertRedirect()->assertSessionHasNoErrors();

        $acceptance->refresh();
        $this->assertTrue((bool) $acceptance->financial_approved);
        $this->assertNull($acceptance->invoice_id);
    }

    public function test_rejects_an_acceptance_that_is_already_approved(): void
    {
        $acceptance = $this->createAcceptance([
            'status' => AcceptanceStatus::WAITING_FOR_PUBLISHING,
            'financial_approved' => true,
            'invoice_id' => $this->createInvoice()->id,
        ]);

        $this->put(route('acceptances.approveFinancial', $acceptance->id))
            ->assertRedirect()
            ->assertSessionHasErrors('message');

        $acceptance->refresh();
        $this->assertSame(AcceptanceStatus::WAITING_FOR_PUBLISHING, $acceptance->status);
    }

    public function test_forbids_a_user_without_the_permission(): void
    {
        $this->actingAs(User::factory()->create());
        $acceptance = $this->createAcceptance(['invoice_id' => $this->createInvoice()->id]);

        $this->put(route('acceptances.approveFinancial', $acceptance->id))
            ->assertForbidden();

        $acceptance->refresh();
        $this->assertFalse((bool) $acceptance->financial_approved);
    }
}
