<?php

namespace Tests\Unit\Billing;

use App\Domains\Billing\Enums\PaymentMethod;
use App\Domains\Billing\Models\Payment;
use App\Domains\Billing\Services\DailyCashReportService;
use App\Domains\Laboratory\Models\Test;
use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Models\AcceptanceItem;
use App\Domains\Reception\Models\Patient;
use App\Domains\Referrer\Models\Referrer;
use ReflectionMethod;
use Tests\TestCase;

/**
 * Pure-logic coverage for DailyCashReportService's row-shaping helpers. The
 * DB-driven date-range aggregation (buildReportData) is covered by the Feature
 * test (tests/Feature/Billing/DailyCashReportServiceTest.php); here the
 * remaining/prepayment math, credit-exclusion, receipt-number extraction and
 * name de-duplication are pinned via reflection over in-memory models — no DB.
 */
class DailyCashReportServiceTest extends TestCase
{
    private DailyCashReportService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new DailyCashReportService;
    }

    /** @param mixed ...$args */
    private function invoke(string $method, ...$args): mixed
    {
        $ref = new ReflectionMethod(DailyCashReportService::class, $method);
        $ref->setAccessible(true);

        return $ref->invoke($this->service, ...$args);
    }

    private function payment(PaymentMethod $method, float $price, array $information = []): Payment
    {
        $payment = new Payment;
        $payment->paymentMethod = $method;
        $payment->price = $price;
        $payment->information = $information;

        return $payment;
    }

    private function acceptance(array $payments, ?Referrer $referrer = null): Acceptance
    {
        $acceptance = new Acceptance;
        $acceptance->setRelation('payments', collect($payments));
        $acceptance->setRelation('referrer', $referrer);

        return $acceptance;
    }

    // ---------------------------------------------------------------------
    // buildRow — remaining = total - paid(non-credit) - discount.
    // ---------------------------------------------------------------------

    public function test_build_row_computes_remaining_and_prepayment(): void
    {
        $acceptance = $this->acceptance([
            $this->payment(PaymentMethod::CASH, 60),
            $this->payment(PaymentMethod::CARD, 20),
        ]);

        $row = $this->invoke('buildRow', $acceptance, 'CBC', 'John Doe', 100.0, 10.0);

        $this->assertSame(100.0, $row['test_price']);
        $this->assertSame(10.0, $row['discount']);
        $this->assertSame(80.0, $row['prepayment']);
        // 100 total - 80 paid - 10 discount.
        $this->assertSame(10.0, $row['remaining']);
        $this->assertSame('CBC', $row['test_name']);
        $this->assertSame('John Doe', $row['patient_name']);
    }

    public function test_build_row_excludes_credit_payments_from_paid_and_methods(): void
    {
        $acceptance = $this->acceptance([
            $this->payment(PaymentMethod::CASH, 40),
            $this->payment(PaymentMethod::CREDIT, 60),
        ]);

        $row = $this->invoke('buildRow', $acceptance, 'CBC', 'John Doe', 100.0, 0.0);

        // Credit is not real cash-in: only the 40 cash counts as prepayment.
        $this->assertSame(40.0, $row['prepayment']);
        $this->assertSame(60.0, $row['remaining']);
        $this->assertSame('CASH', $row['payment_method']);
    }

    public function test_build_row_joins_unique_payment_method_names(): void
    {
        $acceptance = $this->acceptance([
            $this->payment(PaymentMethod::CASH, 10),
            $this->payment(PaymentMethod::CASH, 10),
            $this->payment(PaymentMethod::CARD, 10),
        ]);

        $row = $this->invoke('buildRow', $acceptance, 'CBC', 'John', 30.0, 0.0);

        $this->assertSame('CASH, CARD', $row['payment_method']);
    }

    // ---------------------------------------------------------------------
    // buildRow receipt_no — CARD/TRANSFER only, transferReference preferred.
    // ---------------------------------------------------------------------

    public function test_build_row_collects_receipt_numbers_from_card_and_transfer_only(): void
    {
        $acceptance = $this->acceptance([
            $this->payment(PaymentMethod::TRANSFER, 10, ['transferReference' => 'TR-1']),
            $this->payment(PaymentMethod::CARD, 10, ['receiptReferenceCode' => 'RC-2']),
            // Cash has a reference but is not a card/transfer → excluded.
            $this->payment(PaymentMethod::CASH, 10, ['transferReference' => 'IGNORED']),
        ]);

        $row = $this->invoke('buildRow', $acceptance, 'CBC', 'John', 30.0, 0.0);

        $this->assertSame('TR-1, RC-2', $row['receipt_no']);
    }

    public function test_build_row_receipt_no_dedups_and_drops_blanks(): void
    {
        $acceptance = $this->acceptance([
            $this->payment(PaymentMethod::TRANSFER, 10, ['transferReference' => 'TR-1']),
            $this->payment(PaymentMethod::TRANSFER, 10, ['transferReference' => 'TR-1']),
            $this->payment(PaymentMethod::CARD, 10, []),
        ]);

        $row = $this->invoke('buildRow', $acceptance, 'CBC', 'John', 30.0, 0.0);

        $this->assertSame('TR-1', $row['receipt_no']);
    }

    // ---------------------------------------------------------------------
    // buildRow referrer.
    // ---------------------------------------------------------------------

    public function test_build_row_uses_referrer_full_name_or_empty(): void
    {
        $withReferrer = $this->acceptance([], new Referrer(['fullName' => 'Dr Smith']));
        $this->assertSame('Dr Smith', $this->invoke('buildRow', $withReferrer, 'CBC', 'J', 0.0, 0.0)['referrer']);

        $withoutReferrer = $this->acceptance([]);
        $this->assertSame('', $this->invoke('buildRow', $withoutReferrer, 'CBC', 'J', 0.0, 0.0)['referrer']);
    }

    // ---------------------------------------------------------------------
    // extractTestNames / extractPatientNames.
    // ---------------------------------------------------------------------

    public function test_extract_test_names_unique_and_filtered(): void
    {
        $items = collect([
            $this->itemWithTest('CBC'),
            $this->itemWithTest('CBC'),
            $this->itemWithTest('Lipid Panel'),
        ]);

        $this->assertSame('CBC, Lipid Panel', $this->invoke('extractTestNames', $items));
    }

    public function test_extract_patient_names_merges_item_patients_with_acceptance_patient_unique_by_id(): void
    {
        $p1 = $this->patient(1, 'Alice');
        $p2 = $this->patient(2, 'Bob');
        $acceptancePatient = $this->patient(1, 'Alice'); // same id as p1 → deduped.

        $item = new AcceptanceItem;
        $item->setRelation('patients', collect([$p1, $p2]));

        $acceptance = new Acceptance;
        $acceptance->setRelation('patient', $acceptancePatient);

        $names = $this->invoke('extractPatientNames', collect([$item]), $acceptance);

        $this->assertSame('Alice, Bob', $names);
    }

    private function itemWithTest(string $name): AcceptanceItem
    {
        $item = new AcceptanceItem;
        $item->setRelation('test', new Test(['name' => $name]));

        return $item;
    }

    private function patient(int $id, string $fullName): Patient
    {
        $patient = new Patient(['fullName' => $fullName]);
        $patient->id = $id;

        return $patient;
    }
}
