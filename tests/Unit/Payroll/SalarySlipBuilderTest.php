<?php

declare(strict_types=1);

namespace Tests\Unit\Payroll;

use App\Domains\Payroll\DTOs\LeaveBalance;
use App\Domains\Payroll\Enums\AllowanceKind;
use App\Domains\Payroll\Enums\EmploymentType;
use App\Domains\Payroll\Enums\PayrollCalculation;
use App\Domains\Payroll\Enums\SalarySlipStatus;
use App\Domains\Payroll\Models\EmploymentContract;
use App\Domains\Payroll\Models\PayrollItem;
use App\Domains\Payroll\Models\PayrollItemType;
use App\Domains\Payroll\Models\SalarySlip;
use App\Domains\Payroll\Models\SalarySlipLine;
use App\Domains\Payroll\Services\PayrollItemSchedule;
use App\Domains\Payroll\Services\SalarySlipBuilder;
use Tests\TestCase;

/**
 * The slip arithmetic on its own — no database and no clock. The builder hands back an unsaved
 * slip with its lines attached; keeping it is the service's business.
 *
 * September 2026 has 30 days. The examples use a 1,200.000 salary against a shift of 8-hour days
 * over 22 scheduled working days, so an hour is worth 1200 ÷ 176 and a day 1200 ÷ 22.
 */
class SalarySlipBuilderTest extends TestCase
{
    private const FROM = '2026-09-01';

    private const TO = '2026-09-30';

    /** 22 days × 8 hours. */
    private const SCHEDULED = 10560;

    /** One 8-hour working day, as the shift defines it. */
    private const WORKING_DAY = 480;

    private SalarySlipBuilder $builder;

    protected function setUp(): void
    {
        parent::setUp();
        $this->builder = new SalarySlipBuilder(new PayrollItemSchedule);
    }

    public function test_a_draft_carries_the_terms_it_was_worked_out_from(): void
    {
        // Snapshotted, so an issued slip goes on saying what it said after the contract changes.
        $slip = $this->compose($this->contract(), $this->attendance());

        $this->assertSame(SalarySlipStatus::DRAFT, $slip->status);
        $this->assertSame('1200.000', (string) $slip->basic_salary);
        $this->assertSame('Lab Technician', $slip->position);
        $this->assertSame(self::SCHEDULED, $slip->scheduled_minutes);
        $this->assertSame(self::WORKING_DAY, $slip->working_day_minutes);
        $this->assertSame(22, $slip->attendance['present_days'] ?? null);
        $this->assertTrue($slip->leave_balance['has_shift'] ?? false);
    }

    public function test_a_plain_month_with_nothing_recurring_is_just_the_salary(): void
    {
        $slip = $this->compose($this->contract(), $this->attendance());

        $this->assertSame('1200.000', $this->amountOf($slip, SalarySlipLine::BASE));
        $this->assertSame([SalarySlipLine::BASE], $this->codesOf($slip));
        $this->assertSame('1200.000', (string) $slip->net);
    }

    public function test_the_persons_own_allowances_and_deductions_are_added_and_signed_by_their_kind(): void
    {
        $slip = $this->compose($this->contract(), $this->attendance(), payrollItems: [
            $this->fixedItem('Housing allowance', AllowanceKind::ALLOWANCE, '150.000'),
            $this->percentageItem('Insurance', '5.000'),
        ]);

        $this->assertSame(['Housing allowance', 'Insurance'], $this->labelsOf($slip, SalarySlipLine::ITEM));
        // A deduction carries its own minus, so the net is simply the sum of the lines.
        $this->assertSame(['150.000', '-60.000'], $this->amountsOf($slip, SalarySlipLine::ITEM));
        $this->assertSame('1290.000', (string) $slip->net);
    }

    public function test_a_loan_line_records_which_instalment_it_was(): void
    {
        // Stored on the line rather than counted later, so editing an issued slip cannot renumber
        // the loan behind everyone's back.
        $loan = $this->loanItem('Loan', '3000.000', 12, '2026-07-01');

        $slip = $this->compose($this->contract(), $this->attendance(), payrollItems: [$loan], installmentsTaken: [7 => 2]);
        $line = $this->lineOf($slip, SalarySlipLine::ITEM);

        $this->assertSame('-250.000', $line?->amount);
        $this->assertSame(3, $line?->installment_number);
        $this->assertSame(7, $line?->payroll_item_id);
        $this->assertStringContainsString('instalment 3 of 12', (string) $line?->note);
    }

    public function test_a_loan_already_paid_off_leaves_no_line(): void
    {
        $loan = $this->loanItem('Loan', '3000.000', 12, '2026-07-01');

        $slip = $this->compose($this->contract(), $this->attendance(), payrollItems: [$loan], installmentsTaken: [7 => 12]);

        $this->assertSame([], $this->amountsOf($slip, SalarySlipLine::ITEM));
        $this->assertSame('1200.000', (string) $slip->net);
    }

    public function test_overtime_is_paid_at_the_shifts_hourly_rate_times_the_contracts_multiplier(): void
    {
        $slip = $this->compose($this->contract(), $this->attendance(overtimeMinutes: 90));

        // 1.5 h × (1200 ÷ 176) × 1.25
        $this->assertSame('12.784', $this->amountOf($slip, SalarySlipLine::OVERTIME));
        $this->assertStringContainsString('1 h 30 m', $this->noteOf($slip, SalarySlipLine::OVERTIME));
    }

    public function test_absence_comes_off_at_a_days_worth_of_salary(): void
    {
        $slip = $this->compose($this->contract(), $this->attendance(absentDays: 2));

        // 2 × (1200 ÷ 22), deducted.
        $this->assertSame('-109.091', $this->amountOf($slip, SalarySlipLine::ABSENCE));
    }

    public function test_a_longer_working_day_makes_each_absent_day_cost_more(): void
    {
        // The same salary and the same scheduled hours over 10-hour days is 17.6 working days, so
        // one day off is worth more. Proves the rate follows the shift, not a fixed 8 hours.
        $slip = $this->compose($this->contract(), $this->attendance(absentDays: 1), workingDayMinutes: 600);

        $this->assertSame('-70.588', $this->amountOf($slip, SalarySlipLine::ABSENCE));
    }

    public function test_unpaid_leave_comes_off_by_the_day_and_by_the_hour(): void
    {
        $slip = $this->compose($this->contract(), $this->attendance(), unpaidLeave: ['days' => 1, 'minutes' => 60]);

        // (1200 ÷ 22) + (1200 ÷ 176)
        $this->assertSame('-61.364', $this->amountOf($slip, SalarySlipLine::UNPAID_LEAVE));
    }

    public function test_a_contract_starting_mid_month_is_only_paid_for_the_days_it_covers(): void
    {
        $slip = $this->compose($this->contract(startDate: '2026-09-16'), $this->attendance());

        // The 16th to the 30th is 15 of the month's 30 days.
        $this->assertSame('600.000', $this->amountOf($slip, SalarySlipLine::BASE));
        $this->assertStringContainsString('15 of 30 days', $this->noteOf($slip, SalarySlipLine::BASE));
    }

    public function test_without_a_shift_the_lines_still_appear_with_nothing_priced(): void
    {
        // No shift assignment: there is no hourly or daily rate to work from, so the amounts are
        // left at zero for the payroll user to fill in rather than quietly dropped.
        $slip = $this->compose(
            $this->contract(),
            $this->attendance(overtimeMinutes: 120, absentDays: 1),
            scheduledMinutes: 0,
            workingDayMinutes: null,
        );

        $this->assertSame('0.000', $this->amountOf($slip, SalarySlipLine::OVERTIME));
        $this->assertSame('0.000', $this->amountOf($slip, SalarySlipLine::ABSENCE));
        $this->assertStringContainsString('enter an amount', $this->noteOf($slip, SalarySlipLine::OVERTIME));
    }

    /**
     * @param  array{worked_minutes: int, overtime_minutes: int, late_minutes: int, early_leave_minutes: int, leave_minutes: int, present_days: int, absent_days: int, leave_days: int, corrected_days: int}  $attendance
     * @param  array{days: int, minutes: int}  $unpaidLeave
     * @param  list<PayrollItem>  $payrollItems
     * @param  array<int, int>  $installmentsTaken
     */
    private function compose(
        EmploymentContract $contract,
        array $attendance,
        int $scheduledMinutes = self::SCHEDULED,
        ?int $workingDayMinutes = self::WORKING_DAY,
        array $unpaidLeave = ['days' => 0, 'minutes' => 0],
        array $payrollItems = [],
        array $installmentsTaken = [],
    ): SalarySlip {
        return $this->builder->compose(
            $contract,
            self::FROM,
            self::TO,
            $attendance,
            $scheduledMinutes,
            $workingDayMinutes,
            $unpaidLeave,
            new LeaveBalance(self::FROM, self::TO, [], $workingDayMinutes),
            $payrollItems,
            $installmentsTaken,
        );
    }

    private function contract(string $startDate = '2026-01-01', ?string $endDate = null): EmploymentContract
    {
        return new EmploymentContract([
            'user_id' => 1,
            'position' => 'Lab Technician',
            'employment_type' => EmploymentType::FULL_TIME->value,
            'base_salary' => '1200.000',
            'overtime_multiplier' => '1.25',
            'start_date' => $startDate,
            'end_date' => $endDate,
        ]);
    }

    private function fixedItem(string $name, AllowanceKind $kind, string $amount): PayrollItem
    {
        return $this->item($name, $kind, [
            'calculation' => PayrollCalculation::FIXED->value,
            'amount' => $amount,
            'start_date' => '2026-01-01',
        ]);
    }

    private function percentageItem(string $name, string $percentage): PayrollItem
    {
        return $this->item($name, AllowanceKind::DEDUCTION, [
            'calculation' => PayrollCalculation::PERCENTAGE->value,
            'percentage' => $percentage,
            'start_date' => '2026-01-01',
        ]);
    }

    private function loanItem(string $name, string $total, int $installments, string $start): PayrollItem
    {
        return $this->item($name, AllowanceKind::DEDUCTION, [
            'calculation' => PayrollCalculation::INSTALLMENTS->value,
            'total_amount' => $total,
            'installments' => $installments,
            'start_date' => $start,
        ]);
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function item(string $name, AllowanceKind $kind, array $attributes): PayrollItem
    {
        $item = new PayrollItem($attributes);
        // Unsaved models have no key, but the builder looks the taken count up by id, so give it one.
        $item->id = 7;
        // The type is a required relation on a real row, so the builder reaches through it without
        // a null check; set it here as the repository's eager-load would.
        $item->setRelation('type', new PayrollItemType(['name' => $name, 'kind' => $kind->value]));

        return $item;
    }

    /**
     * @return array{worked_minutes: int, overtime_minutes: int, late_minutes: int, early_leave_minutes: int, leave_minutes: int, present_days: int, absent_days: int, leave_days: int, corrected_days: int}
     */
    private function attendance(int $overtimeMinutes = 0, int $absentDays = 0): array
    {
        return [
            'worked_minutes' => 10560,
            'overtime_minutes' => $overtimeMinutes,
            'late_minutes' => 0,
            'early_leave_minutes' => 0,
            'leave_minutes' => 0,
            'present_days' => 22 - $absentDays,
            'absent_days' => $absentDays,
            'leave_days' => 0,
            'corrected_days' => 0,
        ];
    }

    /**
     * @return list<SalarySlipLine>
     */
    private function linesOf(SalarySlip $slip): array
    {
        /** @var list<SalarySlipLine> $lines */
        $lines = $slip->getRelation('lines')->all();

        return $lines;
    }

    private function lineOf(SalarySlip $slip, string $code): ?SalarySlipLine
    {
        foreach ($this->linesOf($slip) as $line) {
            if ($line->code === $code) {
                return $line;
            }
        }

        return null;
    }

    private function amountOf(SalarySlip $slip, string $code): string
    {
        return $this->amountsOf($slip, $code)[0] ?? '';
    }

    private function noteOf(SalarySlip $slip, string $code): string
    {
        return $this->lineOf($slip, $code)?->note ?? '';
    }

    /**
     * @return list<string>
     */
    private function codesOf(SalarySlip $slip): array
    {
        return array_map(fn (SalarySlipLine $line) => $line->code, $this->linesOf($slip));
    }

    /**
     * @return list<string>
     */
    private function amountsOf(SalarySlip $slip, string $code): array
    {
        return array_values(array_map(
            fn (SalarySlipLine $line) => (string) $line->amount,
            array_filter($this->linesOf($slip), fn (SalarySlipLine $line) => $line->code === $code),
        ));
    }

    /**
     * @return list<string>
     */
    private function labelsOf(SalarySlip $slip, string $code): array
    {
        return array_values(array_map(
            fn (SalarySlipLine $line) => $line->label,
            array_filter($this->linesOf($slip), fn (SalarySlipLine $line) => $line->code === $code),
        ));
    }
}
