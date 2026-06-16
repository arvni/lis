<?php

namespace Tests\Feature\Billing;

use App\Domains\Billing\DTOs\StatementDTO;
use App\Domains\Billing\Enums\InvoiceStatus;
use App\Domains\Billing\Models\Invoice;
use App\Domains\Billing\Models\Statement;
use App\Domains\Billing\Services\StatementService;
use App\Domains\Reception\Models\Patient;
use App\Domains\Referrer\Models\Referrer;
use App\Domains\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StatementServiceTest extends TestCase
{
    use RefreshDatabase;

    private StatementService $service;
    private User $user;
    private Patient $patient;
    private Referrer $referrer;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->patient = Patient::create([
            'fullName' => 'Statement Patient',
            'idNo' => 'STMT001',
            'nationality' => 'OM',
            'dateOfBirth' => '1978-03-20',
            'gender' => 'female',
            'registrar_id' => $this->user->id,
        ]);
        $this->referrer = Referrer::create([
            'fullName' => 'Test Referrer',
            'email' => 'referrer@example.com',
            'phoneNo' => '90000000',
            'billingInfo' => [],
        ]);

        $this->service = app(StatementService::class);
    }

    private function makeInvoice(): Invoice
    {
        return Invoice::create([
            'owner_type' => 'patient',
            'owner_id' => $this->patient->id,
            'user_id' => $this->user->id,
            'status' => InvoiceStatus::WAITING_FOR_PAYMENT,
            'discount' => 0,
        ]);
    }

    /**
     * B-10: storeStatement creates a statement record and sets statement_id on linked invoices.
     */
    public function test_store_statement_links_invoices(): void
    {
        $invoiceA = $this->makeInvoice();
        $invoiceB = $this->makeInvoice();

        $dto = new StatementDTO(
            referrerId: $this->referrer->id,
            issueDate: '2026-04-01',
            invoices: [
                ['id' => $invoiceA->id],
                ['id' => $invoiceB->id],
            ],
        );

        $statement = $this->service->storeStatement($dto);

        $this->assertDatabaseHas('statements', ['id' => $statement->id, 'referrer_id' => $this->referrer->id]);

        $this->assertDatabaseHas('invoices', ['id' => $invoiceA->id, 'statement_id' => $statement->id]);
        $this->assertDatabaseHas('invoices', ['id' => $invoiceB->id, 'statement_id' => $statement->id]);
    }

    /**
     * B-11: updateStatement relinks invoices — new invoices gain statement_id, removed ones are cleared.
     */
    public function test_update_statement_relinks_invoices(): void
    {
        $invoiceA = $this->makeInvoice();
        $invoiceB = $this->makeInvoice();
        $invoiceC = $this->makeInvoice();

        $createDto = new StatementDTO(
            referrerId: $this->referrer->id,
            issueDate: '2026-04-01',
            invoices: [
                ['id' => $invoiceA->id],
                ['id' => $invoiceB->id],
            ],
        );

        $statement = $this->service->storeStatement($createDto);

        $updateDto = new StatementDTO(
            referrerId: $this->referrer->id,
            issueDate: '2026-04-01',
            invoices: [
                ['id' => $invoiceB->id],
                ['id' => $invoiceC->id],
            ],
        );

        $this->service->updateStatement($statement, $updateDto);

        $this->assertDatabaseHas('invoices', ['id' => $invoiceB->id, 'statement_id' => $statement->id]);
        $this->assertDatabaseHas('invoices', ['id' => $invoiceC->id, 'statement_id' => $statement->id]);
        $this->assertDatabaseHas('invoices', ['id' => $invoiceA->id, 'statement_id' => null]);
    }
}
