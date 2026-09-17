<?php

declare(strict_types=1);

namespace Tests\Unit\Payroll;

use App\Domains\Payroll\Enums\PayrollCalculation;
use App\Domains\Payroll\Models\PayrollItem;
use App\Domains\Payroll\Services\PayrollItemSchedule;
use Illuminate\Support\Carbon;
use Tests\TestCase;

/**
 * What a person's recurring item is worth in a month — no database, no clock.
 *
 * Instalments are numbered by what has already been deducted on issued slips, which the caller
 * passes in. A month that never produced a slip therefore does not advance a loan.
 */
class PayrollItemScheduleTest extends TestCase
{
    private PayrollItemSchedule $schedule;

    protected function setUp(): void
    {
        parent::setUp();
        $this->schedule = new PayrollItemSchedule;
    }

    public function test_a_fixed_item_pays_the_same_every_month_it_covers(): void
    {
        $item = $this->item(PayrollCalculation::FIXED, ['amount' => '150.000', 'start_date' => '2026-01-01']);

        $this->assertSame('150.000', $this->schedule->amountFor($item, Carbon::parse('2026-09-15'), '1200.000')?->amount);
    }

    public function test_a_fixed_item_does_not_apply_before_it_starts_or_after_it_ends(): void
    {
        $item = $this->item(PayrollCalculation::FIXED, [
            'amount' => '150.000',
            'start_date' => '2026-03-01',
            'end_date' => '2026-06-30',
        ]);

        $this->assertNull($this->schedule->amountFor($item, Carbon::parse('2026-02-01'), '1200.000'));
        $this->assertNotNull($this->schedule->amountFor($item, Carbon::parse('2026-06-01'), '1200.000'));
        $this->assertNull($this->schedule->amountFor($item, Carbon::parse('2026-07-01'), '1200.000'));
    }

    public function test_an_item_starting_mid_month_still_applies_to_that_whole_month(): void
    {
        // Slips are monthly, so a date inside the month means the month counts.
        $item = $this->item(PayrollCalculation::FIXED, ['amount' => '150.000', 'start_date' => '2026-09-20']);

        $this->assertSame('150.000', $this->schedule->amountFor($item, Carbon::parse('2026-09-01'), '1200.000')?->amount);
    }

    public function test_a_percentage_is_taken_from_the_basic_salary(): void
    {
        $item = $this->item(PayrollCalculation::PERCENTAGE, ['percentage' => '5.000', 'start_date' => '2026-01-01']);

        $amount = $this->schedule->amountFor($item, Carbon::parse('2026-09-01'), '1200.000');
        $this->assertSame('60.000', $amount?->amount);
        // Grouped, because the note is printed as prose beside the figure.
        $this->assertSame('5% of 1,200.000', $amount?->note);
    }

    public function test_a_percentage_without_a_salary_is_left_for_someone_to_fill_in(): void
    {
        // No contract covers the month, so there is no basic salary to take a share of. The line
        // still appears at zero rather than vanishing, so the omission is visible.
        $item = $this->item(PayrollCalculation::PERCENTAGE, ['percentage' => '5.000', 'start_date' => '2026-01-01']);

        $amount = $this->schedule->amountFor($item, Carbon::parse('2026-09-01'), null);
        $this->assertSame('0.000', $amount?->amount);
        $this->assertStringContainsString('enter an amount', (string) $amount?->note);
    }

    public function test_the_next_instalment_follows_what_has_already_been_deducted(): void
    {
        $loan = $this->loan();

        $this->assertSame(1, $this->schedule->amountFor($loan, Carbon::parse('2026-07-01'), null, 0)?->installmentNumber);
        $this->assertSame(3, $this->schedule->amountFor($loan, Carbon::parse('2026-09-01'), null, 2)?->installmentNumber);
        $this->assertSame(
            'instalment 3 of 12 · 2,250.000 remaining',
            $this->schedule->amountFor($loan, Carbon::parse('2026-09-01'), null, 2)?->note,
        );
    }

    public function test_a_month_that_produced_no_slip_does_not_advance_the_loan(): void
    {
        // The calendar has moved on three months, but only one instalment ever went out, so the
        // next one owed is the second — not the fourth.
        $loan = $this->loan();

        $amount = $this->schedule->amountFor($loan, Carbon::parse('2026-10-01'), null, 1);
        $this->assertSame(2, $amount?->installmentNumber);
        $this->assertSame('instalment 2 of 12 · 2,500.000 remaining', $amount?->note);
    }

    public function test_a_loan_does_not_start_before_its_first_month(): void
    {
        $this->assertNull($this->schedule->amountFor($this->loan(), Carbon::parse('2026-06-01'), null, 0));
    }

    public function test_a_loan_stops_once_every_instalment_has_been_taken(): void
    {
        $loan = $this->loan();

        $this->assertNotNull($this->schedule->amountFor($loan, Carbon::parse('2027-06-01'), null, 11));
        $this->assertNull($this->schedule->amountFor($loan, Carbon::parse('2027-07-01'), null, 12));
    }

    public function test_a_total_that_does_not_divide_evenly_still_sums_back_to_the_total(): void
    {
        // 1,000 over 3 cannot be split into equal thousandths; the earliest instalments carry the
        // extra so the loan collects exactly what was lent, not a baisa more or less.
        $loan = $this->item(PayrollCalculation::INSTALLMENTS, [
            'total_amount' => '1000.000',
            'installments' => 3,
            'start_date' => '2026-01-01',
        ]);

        $amounts = array_map(
            fn (int $taken) => (float) $this->schedule->amountFor($loan, Carbon::parse('2026-01-01'), null, $taken)?->amount,
            [0, 1, 2],
        );

        $this->assertSame([333.334, 333.333, 333.333], $amounts);
        $this->assertSame(1000.0, round(array_sum($amounts), 3));
    }

    public function test_the_last_instalment_leaves_nothing_owing(): void
    {
        $loan = $this->item(PayrollCalculation::INSTALLMENTS, [
            'total_amount' => '1000.000',
            'installments' => 3,
            'start_date' => '2026-01-01',
        ]);

        $this->assertSame(
            'instalment 3 of 3 · 0.000 remaining',
            $this->schedule->amountFor($loan, Carbon::parse('2026-03-01'), null, 2)?->note,
        );
    }

    private function loan(): PayrollItem
    {
        return $this->item(PayrollCalculation::INSTALLMENTS, [
            'total_amount' => '3000.000',
            'installments' => 12,
            'start_date' => '2026-07-01',
        ]);
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function item(PayrollCalculation $calculation, array $attributes): PayrollItem
    {
        return new PayrollItem([...$attributes, 'calculation' => $calculation->value]);
    }
}
