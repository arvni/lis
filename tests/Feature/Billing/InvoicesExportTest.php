<?php

namespace Tests\Feature\Billing;

use App\Domains\Billing\Enums\InvoiceItemKind;
use App\Domains\Billing\Enums\InvoiceStatus;
use App\Domains\Billing\Exports\InvoicesExport;
use App\Domains\Billing\Models\Invoice;
use App\Domains\Billing\Repositories\InvoiceRepository;
use App\Domains\Billing\Services\InvoiceComposer;
use App\Domains\Billing\Services\InvoiceItemSyncService;
use App\Domains\Laboratory\Enums\TestType;
use App\Domains\Laboratory\Models\Method;
use App\Domains\Laboratory\Models\MethodTest;
use App\Domains\Laboratory\Models\Test;
use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Models\AcceptanceItem;
use App\Domains\Reception\Models\Patient;
use App\Domains\User\Models\User;
use App\Utils\Constants;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The invoices export must source its line data from the authoritative invoice_items
 * (built by InvoiceComposer), NOT from raw acceptance_items. Only patient information
 * is resolved from the acceptance item(s) linked to each invoice item.
 */
class InvoicesExportTest extends TestCase
{
    use RefreshDatabase;

    private InvoiceComposer $composer;

    private User $user;

    private Patient $patient;

    // Column offsets in the exported row (see InvoicesExport::headings()).
    private const COL_PATIENT_NAME = 3;

    private const COL_TEST = 5;

    private const COL_METHOD = 6;

    private const COL_RATE = 7;

    private const COL_DISCOUNT = 8;

    private const COL_TAXABLE = 9;

    private const COL_NET = 12;

    private const COL_PATIENT_AMOUNT = 13;

    private const COL_NATIONALITY = 15;

    private const COL_GENDER = 16;

    private const COL_AGE = 17;

    protected function setUp(): void
    {
        parent::setUp();

        $this->composer = app(InvoiceComposer::class);

        $this->user = User::factory()->create();
        $this->patient = Patient::create([
            'fullName' => 'Test Patient',
            'idNo' => 'TEST001',
            'nationality' => 'OM',
            'dateOfBirth' => '1990-01-01',
            'gender' => 'male',
            'registrar_id' => $this->user->id,
        ]);
    }

    /**
     * EX-01: a normal test line exports invoice-item data (title, price, discount, totals)
     * while patient columns are resolved from the acceptance item's patient.
     */
    public function test_export_row_uses_invoice_item_data_with_patient_from_acceptance_item(): void
    {
        $invoice = $this->makeInvoice();
        $acceptance = $this->makeAcceptance($invoice);
        $item = $this->addItem($acceptance, $this->makeTest('Vitamin D', 'VITD'), price: 100, discount: 20);
        $this->attachPatient($item);

        $this->composer->recompose($invoice);

        $rows = $this->export();

        $this->assertCount(1, $rows, 'One invoice item => one exported row');
        $row = $rows[0];

        // Line data comes from the invoice item.
        $this->assertSame('Vitamin D', $row[self::COL_TEST]);
        $this->assertSame('M-VITD', $row[self::COL_METHOD]);
        $this->assertSame('100', $row[self::COL_RATE]);
        $this->assertSame('20', $row[self::COL_DISCOUNT]);
        $this->assertSame('80', $row[self::COL_TAXABLE]);
        $this->assertSame('80', $row[self::COL_NET]);
        $this->assertSame('80', $row[self::COL_PATIENT_AMOUNT]);

        // Patient info comes from the acceptance item's patient.
        $this->assertSame('Test Patient', $row[self::COL_PATIENT_NAME]);
        $this->assertSame(Constants::countries('OM'), $row[self::COL_NATIONALITY]);
        $this->assertSame('Male', $row[self::COL_GENDER]);
        $this->assertSame($this->patient->age, $row[self::COL_AGE]);
    }

    /**
     * EX-02: a panel's children collapse into a single invoice_item, so the export emits
     * ONE row with the summed price — proving it reads invoice items, not acceptance items.
     */
    public function test_export_collapses_panel_children_into_one_invoice_item_row(): void
    {
        $invoice = $this->makeInvoice();
        $acceptance = $this->makeAcceptance($invoice);
        $panelTest = $this->makeTest('Fertility Panel', 'FERT', TestType::PANEL);
        $a = $this->addItem($acceptance, $panelTest, price: 50, panelId: 99);
        $b = $this->addItem($acceptance, $panelTest, price: 70, panelId: 99);
        $this->attachPatient($a);
        $this->attachPatient($b);

        $this->composer->recompose($invoice);

        $rows = $this->export();

        $this->assertCount(1, $rows, 'Panel children must collapse into one exported row');
        $this->assertSame('120', $rows[0][self::COL_RATE]);
        $this->assertSame('Fertility Panel', $rows[0][self::COL_TEST]);
        $this->assertSame('Test Patient', $rows[0][self::COL_PATIENT_NAME]);
    }

    /**
     * EX-03: dynamic columns are built from the invoice item's customParameters price map,
     * with the value coming from the invoice item.
     */
    public function test_export_dynamic_columns_come_from_invoice_item_custom_parameters(): void
    {
        $invoice = $this->makeInvoice();
        $acceptance = $this->makeAcceptance($invoice);
        $item = $this->addItem(
            $acceptance,
            $this->makeTest('IVF', 'IVF01'),
            price: 100,
            customParameters: ['price' => ['noEmbryos' => 3]],
        );
        $this->attachPatient($item);

        $this->composer->recompose($invoice);

        $export = new InvoicesExport($this->fetchInvoices());
        $headings = $export->headings();
        $rows = $export->map($this->fetchInvoices()->first());

        $this->assertContains('No. Embryos', $headings);
        $embryoCol = array_search('No. Embryos', $headings, true);
        $this->assertSame(3, $rows[0][$embryoCol]);
    }

    /**
     * EX-04: manual-fee invoice items (which have no linked acceptance item) still export a
     * row, with blank patient/method — this is the new behavior of sourcing invoice items.
     */
    public function test_export_includes_manual_fee_lines_with_blank_patient(): void
    {
        $invoice = $this->makeInvoice();

        app(InvoiceItemSyncService::class)->sync($invoice, [[
            'kind' => InvoiceItemKind::MANUAL_FEE->value,
            'title' => 'Registration Fee',
            'unit_price' => 25,
            'qty' => 1,
        ]]);

        $rows = $this->export();

        $this->assertCount(1, $rows);
        $this->assertSame('Registration Fee', $rows[0][self::COL_TEST]);
        $this->assertSame('25', $rows[0][self::COL_RATE]);
        $this->assertSame('', $rows[0][self::COL_PATIENT_NAME]);
        $this->assertSame('', $rows[0][self::COL_METHOD]);
    }

    // --- helpers ---------------------------------------------------------

    /**
     * @return array<int, array<int, mixed>>
     */
    private function export(): array
    {
        $invoices = $this->fetchInvoices();

        return (new InvoicesExport($invoices))->map($invoices->first());
    }

    private function fetchInvoices(): \Illuminate\Database\Eloquent\Collection
    {
        return app(InvoiceRepository::class)->listAllInvoices([
            'sort' => ['field' => 'invoices.id', 'sort' => 'asc'],
        ]);
    }

    private function makeInvoice(array $overrides = []): Invoice
    {
        return Invoice::create(array_merge([
            'owner_type' => 'patient',
            'owner_id' => $this->patient->id,
            'user_id' => $this->user->id,
            'status' => InvoiceStatus::WAITING_FOR_PAYMENT,
            'discount' => 0,
        ], $overrides));
    }

    private function makeAcceptance(Invoice $invoice): Acceptance
    {
        return Acceptance::create([
            'patient_id' => $this->patient->id,
            'invoice_id' => $invoice->id,
            'acceptor_id' => $this->user->id,
            'status' => 'pending',
            'step' => 1,
            'financial_approved' => false,
            'out_patient' => false,
            'waiting_for_pooling' => false,
        ]);
    }

    private function makeTest(string $name, string $code, TestType $type = TestType::TEST, bool $canMerge = false): Test
    {
        return Test::create([
            'name' => $name,
            'fullName' => $name,
            'code' => $code,
            'type' => $type,
            'status' => true,
            'can_merge' => $canMerge,
        ]);
    }

    private function addItem(Acceptance $acceptance, Test $test, float $price, float $discount = 0, ?int $panelId = null, ?array $customParameters = null): AcceptanceItem
    {
        $method = Method::create([
            'name' => 'M-'.$test->code,
            'price' => $price,
            'status' => true,
            'no_patient' => 1,
            'no_sample' => 1,
        ]);
        $methodTest = MethodTest::create([
            'method_id' => $method->id,
            'test_id' => $test->id,
            'is_default' => true,
            'status' => true,
        ]);

        return AcceptanceItem::create([
            'acceptance_id' => $acceptance->id,
            'method_test_id' => $methodTest->id,
            'price' => $price,
            'discount' => $discount,
            'panel_id' => $panelId,
            'customParameters' => $customParameters,
        ]);
    }

    private function attachPatient(AcceptanceItem $item): void
    {
        $item->patients()->attach($this->patient->id, ['order' => 1, 'main' => true]);
    }
}
