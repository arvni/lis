<?php

declare(strict_types=1);

namespace Tests\Feature\Billing;

use App\Domains\Billing\Enums\InvoiceStatus;
use App\Domains\Billing\Models\Invoice;
use App\Domains\Billing\Repositories\InvoiceRepository;
use App\Domains\Reception\Enums\AcceptanceStatus;
use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Models\Patient;
use App\Domains\Referrer\Models\Referrer;
use App\Domains\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReferrerInvoicesForStatementTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private Patient $patient;

    private Referrer $referrer;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->patient = Patient::create([
            'fullName' => 'Statement Patient',
            'idNo' => 'STMT100',
            'nationality' => 'OM',
            'dateOfBirth' => '1980-01-01',
            'gender' => 'female',
            'registrar_id' => $this->user->id,
        ]);
        $this->referrer = Referrer::create([
            'fullName' => 'Statement Referrer',
            'email' => 'statement-referrer@example.com',
            'phoneNo' => '90000000',
            'billingInfo' => [],
        ]);
    }

    public function test_canceled_invoices_are_not_offered_for_a_statement(): void
    {
        $open = $this->makeInvoiceWithAcceptance(InvoiceStatus::WAITING_FOR_PAYMENT);
        $canceled = $this->makeInvoiceWithAcceptance(InvoiceStatus::CANCELED);

        $invoices = app(InvoiceRepository::class)
            ->listReferrerInvoicesForStatement($this->referrer->id, now()->format('Y-m'));

        $ids = $invoices->pluck('id')->all();

        $this->assertContains($open->id, $ids);
        $this->assertNotContains($canceled->id, $ids);
    }

    private function makeInvoiceWithAcceptance(InvoiceStatus $status): Invoice
    {
        $invoice = Invoice::create([
            'owner_type' => 'patient',
            'owner_id' => $this->patient->id,
            'user_id' => $this->user->id,
            'status' => $status,
            'discount' => 0,
        ]);

        Acceptance::create([
            'status' => AcceptanceStatus::PENDING,
            'step' => 5,
            'patient_id' => $this->patient->id,
            'acceptor_id' => $this->user->id,
            'referrer_id' => $this->referrer->id,
            'financial_approved' => false,
            'out_patient' => false,
            'waiting_for_pooling' => false,
            'invoice_id' => $invoice->id,
        ]);

        return $invoice;
    }
}
