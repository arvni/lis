<?php

namespace Tests\Unit\Billing;

use App\Domains\Billing\Enums\PaymentMethod;
use App\Domains\Billing\Models\Payment;
use App\Domains\Billing\Services\DailyCashReportService;
use App\Domains\Laboratory\Enums\TestType;
use App\Domains\Laboratory\Models\Test;
use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Models\AcceptanceItem;
use App\Domains\Reception\Models\Patient;
use App\Domains\Referrer\Models\Referrer;
use Carbon\Carbon;
use ReflectionMethod;
use Tests\TestCase;

/**
 * Pure-logic coverage for DailyCashReportService's row-shaping helpers. The
 * DB-driven date-range aggregation (buildReportData) is covered by the Feature
 * test (tests/Feature/Billing/DailyCashReportServiceTest.php); here the
 * date-scoped takings math, credit-exclusion, per-method split, receipt-number
 * extraction and name de-duplication are pinned via reflection over in-memory
 * models — no DB.
 */
class DailyCashReportServiceTest extends TestCase
{
    private DailyCashReportService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = app(DailyCashReportService::class);
    }

    /** @param mixed ...$args */
    private function invoke(string $method, ...$args): mixed
    {
        $ref = new ReflectionMethod(DailyCashReportService::class, $method);
        $ref->setAccessible(true);

        return $ref->invoke($this->service, ...$args);
    }

    /** @return array{0: Carbon, 1: Carbon} */
    private function today(): array
    {
        return [Carbon::now()->startOfDay(), Carbon::now()->endOfDay()];
    }

    private function payment(
        PaymentMethod $method,
        float $price,
        array $information = [],
        ?Carbon $at = null,
    ): Payment {
        $payment = new Payment;
        $payment->paymentMethod = $method;
        $payment->price = $price;
        $payment->information = $information;
        $payment->created_at = $at ?? Carbon::now();

        return $payment;
    }

    private function item(
        float $price,
        float $discount = 0.0,
        string $testName = 'CBC',
        TestType $type = TestType::TEST,
        ?Carbon $at = null,
    ): AcceptanceItem {
        $item = new AcceptanceItem;
        $item->price = $price;
        $item->discount = $discount;
        $item->created_at = $at ?? Carbon::now();
        $item->setRelation('test', new Test(['name' => $testName, 'type' => $type]));
        $item->setRelation('patients', collect());

        return $item;
    }

    private function acceptance(array $payments, array $items = [], ?Referrer $referrer = null, ?Patient $patient = null): Acceptance
    {
        $acceptance = new Acceptance;
        $acceptance->setRelation('payments', collect($payments));
        $acceptance->setRelation('acceptanceItems', collect($items));
        $acceptance->setRelation('referrer', $referrer);
        $acceptance->setRelation('patient', $patient);

        return $acceptance;
    }

    // ---------------------------------------------------------------------
    // buildRow — takings are the report date's collections only.
    // ---------------------------------------------------------------------

    // The bug this report was rebuilt for: an acceptance settled days later used
    // to show its whole settled amount as that day's cash.
    public function test_build_row_counts_only_payments_collected_on_the_report_date(): void
    {
        $acceptance = $this->acceptance(
            payments: [
                $this->payment(PaymentMethod::CASH, 60),
                $this->payment(PaymentMethod::CASH, 20, at: Carbon::now()->subDays(3)),
            ],
            items: [$this->item(100.0)],
        );

        $row = $this->invoke('buildRow', $acceptance, $this->today());

        // Only the 60 taken today is today's cash — not the 80 collected in total.
        $this->assertSame(60.0, $row['prepayment']);
        $this->assertSame(60.0, $row['paid_cash_card']);
    }

    public function test_build_row_remaining_nets_only_the_days_money(): void
    {
        $acceptance = $this->acceptance(
            payments: [
                $this->payment(PaymentMethod::CASH, 30),
                $this->payment(PaymentMethod::CARD, 40, at: Carbon::now()->subDay()),
            ],
            items: [$this->item(100.0, 10.0)],
        );

        $row = $this->invoke('buildRow', $acceptance, $this->today());

        $this->assertSame(100.0, $row['test_price']);
        $this->assertSame(10.0, $row['discount']);
        $this->assertSame(30.0, $row['prepayment']);
        // That day's balance only: 100 booked - 30 collected today - 10 discount.
        // Yesterday's 40 belongs to yesterday's report, not this one.
        $this->assertSame(60.0, $row['remaining']);
        $this->assertSame('CBC', $row['test_name']);
    }

    public function test_build_row_counts_only_items_added_on_the_report_date(): void
    {
        $acceptance = $this->acceptance(
            payments: [],
            items: [
                $this->item(100.0),
                $this->item(50.0, 0.0, 'Lipid Panel', at: Carbon::now()->subDays(3)),
            ],
        );

        $row = $this->invoke('buildRow', $acceptance, $this->today());

        // Only today's 100 is today's billing; the older item had its own day.
        $this->assertSame(100.0, $row['test_price']);
        $this->assertSame('CBC', $row['test_name']);
    }

    // A row that exists purely because money arrived books nothing, so it reports a
    // price of 0 and a negative balance — the day reduced what was outstanding. This
    // is what keeps the daily columns additive across the month.
    public function test_build_row_for_a_collection_only_day_reports_a_negative_balance(): void
    {
        $acceptance = $this->acceptance(
            payments: [$this->payment(PaymentMethod::CASH, 25)],
            items: [$this->item(100.0, 0.0, 'CBC', at: Carbon::now()->subDays(3))],
        );

        $row = $this->invoke('buildRow', $acceptance, $this->today());

        $this->assertSame(0.0, $row['test_price']);
        $this->assertSame(25.0, $row['prepayment']);
        $this->assertSame(-25.0, $row['remaining']);
        $this->assertSame('', $row['test_name']);
    }

    public function test_build_row_excludes_credit_from_takings_and_methods(): void
    {
        $acceptance = $this->acceptance(
            payments: [
                $this->payment(PaymentMethod::CASH, 40),
                $this->payment(PaymentMethod::CREDIT, 60),
            ],
            items: [$this->item(100.0)],
        );

        $row = $this->invoke('buildRow', $acceptance, $this->today());

        // Credit is not real cash-in: only the 40 cash counts.
        $this->assertSame(40.0, $row['prepayment']);
        $this->assertSame(60.0, $row['remaining']);
        $this->assertSame('CASH', $row['payment_method']);
    }

    public function test_build_row_joins_unique_payment_method_names(): void
    {
        $acceptance = $this->acceptance(
            payments: [
                $this->payment(PaymentMethod::CASH, 10),
                $this->payment(PaymentMethod::CASH, 10),
                $this->payment(PaymentMethod::CARD, 10),
            ],
            items: [$this->item(30.0)],
        );

        $row = $this->invoke('buildRow', $acceptance, $this->today());

        $this->assertSame('CASH, CARD', $row['payment_method']);
    }

    // The sheet's summary line sums these instead of parsing the label above,
    // which a part-cash part-card row would defeat.
    public function test_build_row_splits_the_days_takings_by_method(): void
    {
        $acceptance = $this->acceptance(
            payments: [
                $this->payment(PaymentMethod::CASH, 10),
                $this->payment(PaymentMethod::CARD, 20),
                $this->payment(PaymentMethod::TRANSFER, 30),
            ],
            items: [$this->item(60.0)],
        );

        $row = $this->invoke('buildRow', $acceptance, $this->today());

        $this->assertSame(30.0, $row['paid_cash_card']);
        $this->assertSame(30.0, $row['paid_transfer']);
        $this->assertSame(60.0, $row['prepayment']);
    }

    // ---------------------------------------------------------------------
    // buildRow receipt_no — CARD/TRANSFER only, transferReference preferred.
    // ---------------------------------------------------------------------

    public function test_build_row_collects_receipt_numbers_from_card_and_transfer_only(): void
    {
        $acceptance = $this->acceptance(
            payments: [
                $this->payment(PaymentMethod::TRANSFER, 10, ['transferReference' => 'TR-1']),
                $this->payment(PaymentMethod::CARD, 10, ['receiptReferenceCode' => 'RC-2']),
                // Cash has a reference but is not a card/transfer → excluded.
                $this->payment(PaymentMethod::CASH, 10, ['transferReference' => 'IGNORED']),
            ],
            items: [$this->item(30.0)],
        );

        $row = $this->invoke('buildRow', $acceptance, $this->today());

        $this->assertSame('TR-1, RC-2', $row['receipt_no']);
    }

    public function test_build_row_receipt_no_dedups_and_drops_blanks(): void
    {
        $acceptance = $this->acceptance(
            payments: [
                $this->payment(PaymentMethod::TRANSFER, 10, ['transferReference' => 'TR-1']),
                $this->payment(PaymentMethod::TRANSFER, 10, ['transferReference' => 'TR-1']),
                $this->payment(PaymentMethod::CARD, 10, []),
            ],
            items: [$this->item(30.0)],
        );

        $row = $this->invoke('buildRow', $acceptance, $this->today());

        $this->assertSame('TR-1', $row['receipt_no']);
    }

    public function test_build_row_receipt_no_ignores_payments_from_other_days(): void
    {
        $acceptance = $this->acceptance(
            payments: [
                $this->payment(PaymentMethod::CARD, 10, ['receiptReferenceCode' => 'TODAY'], Carbon::now()),
                $this->payment(PaymentMethod::CARD, 10, ['receiptReferenceCode' => 'YESTERDAY'], Carbon::now()->subDay()),
            ],
            items: [$this->item(20.0)],
        );

        $row = $this->invoke('buildRow', $acceptance, $this->today());

        $this->assertSame('TODAY', $row['receipt_no']);
    }

    // ---------------------------------------------------------------------
    // buildRow referrer / service items.
    // ---------------------------------------------------------------------

    public function test_build_row_uses_referrer_full_name_or_empty(): void
    {
        $withReferrer = $this->acceptance([], [], new Referrer(['fullName' => 'Dr Smith']));
        $this->assertSame('Dr Smith', $this->invoke('buildRow', $withReferrer, $this->today())['referrer']);

        $withoutReferrer = $this->acceptance([]);
        $this->assertSame('', $this->invoke('buildRow', $withoutReferrer, $this->today())['referrer']);
    }

    // A service is billed money like a test, so it counts towards the acceptance's
    // price and its outstanding balance.
    public function test_build_row_includes_service_items_in_the_price(): void
    {
        $acceptance = $this->acceptance(
            payments: [],
            items: [
                $this->item(100.0, 0.0, 'CBC'),
                $this->item(50.0, 0.0, 'Home Visit', TestType::SERVICE),
            ],
        );

        $row = $this->invoke('buildRow', $acceptance, $this->today());

        $this->assertSame(150.0, $row['test_price']);
        $this->assertSame('CBC, Home Visit', $row['test_name']);
        $this->assertSame(150.0, $row['remaining']);
    }

    // ---------------------------------------------------------------------
    // extractTestNames / extractPatientNames.
    // ---------------------------------------------------------------------

    public function test_extract_test_names_unique_and_filtered(): void
    {
        $items = collect([
            $this->item(0.0, 0.0, 'CBC'),
            $this->item(0.0, 0.0, 'CBC'),
            $this->item(0.0, 0.0, 'Lipid Panel'),
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

    private function patient(int $id, string $fullName): Patient
    {
        $patient = new Patient(['fullName' => $fullName]);
        $patient->id = $id;

        return $patient;
    }
}
