<?php

namespace Tests\Feature\Billing;

use App\Domains\Billing\DTOs\StatementDTO;
use App\Domains\Billing\Enums\InvoiceItemKind;
use App\Domains\Billing\Enums\InvoiceStatus;
use App\Domains\Billing\Models\Invoice;
use App\Domains\Billing\Models\InvoiceItem;
use App\Domains\Billing\Models\Statement;
use App\Domains\Billing\Services\StatementService;
use App\Domains\Laboratory\Enums\TestType;
use App\Domains\Laboratory\Models\Method;
use App\Domains\Laboratory\Models\MethodTest;
use App\Domains\Laboratory\Models\Test;
use App\Domains\Reception\Enums\AcceptanceStatus;
use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Models\AcceptanceItem;
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

    /**
     * Statement amounts must be sourced from invoice_items, never acceptance_items.
     * The acceptance items here carry deliberately different (larger) figures than the
     * invoice items; the export must reflect the invoice items, proving the source.
     */
    public function test_export_amounts_come_from_invoice_items_not_acceptance_items(): void
    {
        $invoice = $this->makeInvoice();
        $invoice->update(['discount' => 5]);

        $acceptance = Acceptance::create([
            'status'              => AcceptanceStatus::PENDING,
            'step'                => 5,
            'patient_id'          => $this->patient->id,
            'acceptor_id'         => $this->user->id,
            'referrer_id'         => $this->referrer->id,
            'financial_approved'  => false,
            'out_patient'         => false,
            'waiting_for_pooling' => false,
            'invoice_id'          => $invoice->id,
        ]);

        $test = Test::create(['name' => 'T', 'fullName' => 'T', 'code' => 'T' . uniqid(), 'type' => TestType::TEST, 'status' => true, 'can_merge' => false]);
        $method = Method::create(['name' => 'M', 'price' => 0, 'turnaround_time' => 1, 'status' => true, 'no_patient' => 1, 'no_sample' => 1]);
        $methodTest = MethodTest::create(['method_id' => $method->id, 'test_id' => $test->id, 'is_default' => true, 'status' => true]);

        // Decoy: acceptance-item figures that must NOT feed the statement.
        AcceptanceItem::create([
            'acceptance_id'    => $acceptance->id,
            'method_test_id'   => $methodTest->id,
            'price'            => 999,
            'discount'         => 99,
            'reportless'       => false,
            'sampleless'       => false,
            'no_sample'        => 1,
            'customParameters' => [],
            'timeline'         => [],
        ]);

        // Real billing source: two invoice items → price 200, discount 20.
        foreach ([['Item A', 120, 10], ['Item B', 80, 10]] as [$title, $price, $discount]) {
            InvoiceItem::create([
                'invoice_id'    => $invoice->id,
                'acceptance_id' => $acceptance->id,
                'kind'          => InvoiceItemKind::TEST->value,
                'test_id'       => $test->id,
                'title'         => $title,
                'unit_price'    => $price,
                'qty'           => 1,
                'price'         => $price,
                'discount'      => $discount,
            ]);
        }

        $dto = new StatementDTO(
            referrerId: $this->referrer->id,
            issueDate: '2026-04-01',
            invoices: [['id' => $invoice->id]],
        );
        $statement = $this->service->storeStatement($dto);

        $export = $this->service->prepareExportData($statement);
        $row = $export->invoicesData[0];

        // Invoice items: gross 200, item discounts 20; invoice-level discount 5 → net 175.
        $this->assertEqualsWithDelta(200.0, (float) $row['gross_amount'], 0.001);
        $this->assertEqualsWithDelta(20.0, (float) $row['item_discounts'], 0.001);
        $this->assertEqualsWithDelta(5.0, (float) $row['invoice_discount'], 0.001);
        $this->assertEqualsWithDelta(175.0, (float) $row['net_amount'], 0.001);
        $this->assertEqualsWithDelta(175.0, (float) $export->exportOptions['total_amount'], 0.001);
    }
}
