<?php

namespace Tests\Unit\Billing;

use App\Domains\Billing\Exports\DailyCashReportExport;
use Carbon\Carbon;
use ReflectionProperty;
use Tests\TestCase;

/**
 * The sheet's summary line — PAID / NOT PAID / TRANSFER. It reads the numeric
 * per-method fields the service pre-splits, so these cases pin the three ways the
 * old label-matching summary got the day's money wrong.
 */
class DailyCashReportExportTest extends TestCase
{
    /** @return array<string, float> */
    private function summaryFor(array $rows): array
    {
        $export = new DailyCashReportExport(collect($rows), Carbon::now());

        $property = new ReflectionProperty(DailyCashReportExport::class, 'summary');
        $property->setAccessible(true);

        return $property->getValue($export);
    }

    private function row(array $overrides = []): array
    {
        return array_merge([
            'payment_method' => 'CASH',
            'test_price'     => 100.0,
            'discount'       => 0.0,
            'prepayment'     => 0.0,
            'paid_cash_card' => 0.0,
            'paid_transfer'  => 0.0,
            'remaining'      => 0.0,
        ], $overrides);
    }

    // Used to be dropped from PAID entirely: "CASH, CARD" matched neither 'CASH'
    // nor 'CARD' in the old whereIn on the joined label.
    public function test_paid_counts_a_row_settled_part_cash_part_card(): void
    {
        $summary = $this->summaryFor([
            $this->row([
                'payment_method' => 'CASH, CARD',
                'prepayment'     => 50.0,
                'paid_cash_card' => 50.0,
            ]),
        ]);

        $this->assertEqualsWithDelta(50.0, $summary['paid'], 0.001);
    }

    // Used to report the full invoice price as transferred.
    public function test_transfer_is_the_money_transferred_not_the_invoice_price(): void
    {
        $summary = $this->summaryFor([
            $this->row([
                'payment_method' => 'TRANSFER',
                'test_price'     => 100.0,
                'prepayment'     => 40.0,
                'paid_transfer'  => 40.0,
            ]),
        ]);

        $this->assertEqualsWithDelta(40.0, $summary['transfer'], 0.001);
        $this->assertEqualsWithDelta(0.0, $summary['paid'], 0.001);
    }

    // Used to be structurally always 0: no row can carry a 'CREDIT' label, since
    // credit is stripped out of the method list before it is joined.
    public function test_not_paid_is_the_outstanding_balance(): void
    {
        $summary = $this->summaryFor([
            $this->row(['remaining' => 30.0]),
            $this->row(['remaining' => 20.0]),
        ]);

        $this->assertEqualsWithDelta(50.0, $summary['not_paid'], 0.001);
    }

    public function test_totals_accumulate_across_rows(): void
    {
        $summary = $this->summaryFor([
            $this->row(['paid_cash_card' => 10.0, 'remaining' => 5.0]),
            $this->row(['paid_cash_card' => 15.0, 'paid_transfer' => 20.0]),
            $this->row(['paid_transfer' => 5.0, 'remaining' => 2.5]),
        ]);

        $this->assertEqualsWithDelta(25.0, $summary['paid'], 0.001);
        $this->assertEqualsWithDelta(25.0, $summary['transfer'], 0.001);
        $this->assertEqualsWithDelta(7.5, $summary['not_paid'], 0.001);
    }

    public function test_summary_is_zero_for_an_empty_report(): void
    {
        $summary = $this->summaryFor([]);

        $this->assertEqualsWithDelta(0.0, $summary['paid'], 0.001);
        $this->assertEqualsWithDelta(0.0, $summary['transfer'], 0.001);
        $this->assertEqualsWithDelta(0.0, $summary['not_paid'], 0.001);
    }
}
