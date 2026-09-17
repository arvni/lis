<?php

declare(strict_types=1);

namespace App\Domains\Payroll\Services;

use App\Domains\Payroll\DTOs\LeaveBalance;
use App\Domains\Payroll\Enums\SalarySlipStatus;
use App\Domains\Payroll\Models\EmploymentContract;
use App\Domains\Payroll\Models\PayrollItem;
use App\Domains\Payroll\Models\SalarySlip;
use App\Domains\Payroll\Models\SalarySlipLine;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Carbon;

/**
 * Turns a contract, a month's attendance and a person's recurring items into a draft salary slip.
 *
 * Returns an unsaved slip with its lines attached, so the arithmetic can be tested without a
 * database and the service decides separately whether to keep it.
 *
 * Every figure the slip was worked out from is copied onto it — the basic salary, the working day,
 * the attendance totals, the leave balance — because once issued it has to go on saying what it
 * said, even after a contract is changed or an attendance day is corrected.
 *
 * Rates come from the hours the person was actually scheduled, so overtime is priced against the
 * same shift it was measured against. Where there are no scheduled hours to divide by, the line is
 * still produced, at zero and with a note, rather than silently dropped.
 */
class SalarySlipBuilder
{
    private const SCALE = 3;

    public function __construct(private readonly PayrollItemSchedule $schedule) {}

    /**
     * @param  array{worked_minutes: int, overtime_minutes: int, late_minutes: int, early_leave_minutes: int, leave_minutes: int, present_days: int, absent_days: int, leave_days: int, corrected_days: int}  $attendance
     * @param  int|null  $workingDayMinutes  how long one of this person's working days is, from
     *                                       their shift; null when they have no shift assignment
     * @param  array{days: int, minutes: int}  $unpaidLeave  approved leave of kinds that are not paid
     * @param  iterable<PayrollItem>  $payrollItems  the person's recurring allowances and deductions
     * @param  array<int, int>  $installmentsTaken  instalments already deducted, keyed by item id
     */
    public function compose(
        EmploymentContract $contract,
        string $from,
        string $to,
        array $attendance,
        int $scheduledMinutes,
        ?int $workingDayMinutes,
        array $unpaidLeave,
        LeaveBalance $balance,
        iterable $payrollItems = [],
        array $installmentsTaken = [],
    ): SalarySlip {
        $base = $this->baseSalary($contract, $from, $to);

        $lines = [$this->baseLine($contract, $from, $to, $base)];

        $hourlyRate = $scheduledMinutes > 0 ? $base / ($scheduledMinutes / 60) : null;
        $workingDays = $workingDayMinutes !== null && $workingDayMinutes > 0
            ? intdiv($scheduledMinutes, $workingDayMinutes)
            : 0;
        $dailyRate = $workingDays > 0 ? $base / $workingDays : null;

        if ($attendance['overtime_minutes'] > 0) {
            $lines[] = $this->overtimeLine($contract, $attendance['overtime_minutes'], $hourlyRate);
        }
        if ($attendance['absent_days'] > 0) {
            $lines[] = $this->absenceLine($attendance['absent_days'], $dailyRate);
        }
        if ($unpaidLeave['days'] > 0 || $unpaidLeave['minutes'] > 0) {
            $lines[] = $this->unpaidLeaveLine($unpaidLeave, $dailyRate, $hourlyRate);
        }

        foreach ($payrollItems as $item) {
            $line = $this->payrollItemLine(
                $item,
                $from,
                (string) $contract->base_salary,
                $installmentsTaken[$item->id] ?? 0,
            );
            if ($line !== null) {
                $lines[] = $line;
            }
        }

        foreach ($lines as $index => $line) {
            $line->sort_order = $index;
        }

        $slip = new SalarySlip([
            'user_id' => $contract->user_id,
            'employment_contract_id' => $contract->id,
            'period_from' => $from,
            'period_to' => $to,
            'status' => SalarySlipStatus::DRAFT->value,
            'net' => $this->money($this->sum($lines)),
            'basic_salary' => (string) $contract->base_salary,
            'position' => $contract->position,
            'employment_type' => $contract->employment_type->value,
            'scheduled_minutes' => $scheduledMinutes,
            'working_day_minutes' => $workingDayMinutes,
            'attendance' => $attendance,
            'leave_balance' => $balance->toArray(),
        ]);
        $slip->setRelation('lines', new Collection($lines));

        return $slip;
    }

    /**
     * The salary for the period, reduced pro rata when the contract only covers part of it —
     * someone who started on the 15th is not owed the whole month.
     */
    private function baseSalary(EmploymentContract $contract, string $from, string $to): float
    {
        $salary = (float) $contract->base_salary;
        $periodDays = $this->daysBetween($from, $to);
        if ($periodDays === 0) {
            return 0.0;
        }

        $covered = $this->coveredDays($contract, $from, $to);

        return $covered >= $periodDays ? $salary : $salary * $covered / $periodDays;
    }

    private function baseLine(EmploymentContract $contract, string $from, string $to, float $base): SalarySlipLine
    {
        $periodDays = $this->daysBetween($from, $to);
        $covered = $this->coveredDays($contract, $from, $to);
        $note = $covered < $periodDays
            ? sprintf('%d of %d days — the contract does not cover the whole period', $covered, $periodDays)
            : null;

        return new SalarySlipLine([
            'code' => SalarySlipLine::BASE,
            'label' => 'Base salary',
            'amount' => $this->money($base),
            'note' => $note,
        ]);
    }

    private function overtimeLine(EmploymentContract $contract, int $minutes, ?float $hourlyRate): SalarySlipLine
    {
        $multiplier = (float) $contract->overtime_multiplier;

        if ($hourlyRate === null) {
            return new SalarySlipLine([
                'code' => SalarySlipLine::OVERTIME,
                'label' => 'Overtime',
                'amount' => $this->money(0),
                'note' => sprintf('%s recorded, but there are no scheduled hours to price it against — enter an amount', $this->duration($minutes)),
            ]);
        }

        return new SalarySlipLine([
            'code' => SalarySlipLine::OVERTIME,
            'label' => 'Overtime',
            'amount' => $this->money($minutes / 60 * $hourlyRate * $multiplier),
            'note' => sprintf('%s at %s/hour × %s', $this->duration($minutes), $this->money($hourlyRate), rtrim(rtrim((string) $multiplier, '0'), '.')),
        ]);
    }

    private function absenceLine(int $absentDays, ?float $dailyRate): SalarySlipLine
    {
        if ($dailyRate === null) {
            return new SalarySlipLine([
                'code' => SalarySlipLine::ABSENCE,
                'label' => 'Absence',
                'amount' => $this->money(0),
                'note' => sprintf('%d day(s) absent, but there are no scheduled days to price it against — enter an amount', $absentDays),
            ]);
        }

        return new SalarySlipLine([
            'code' => SalarySlipLine::ABSENCE,
            'label' => 'Absence',
            'amount' => $this->money(-$absentDays * $dailyRate),
            'note' => sprintf('%d day(s) at %s/day', $absentDays, $this->money($dailyRate)),
        ]);
    }

    /**
     * @param  array{days: int, minutes: int}  $unpaidLeave
     */
    private function unpaidLeaveLine(array $unpaidLeave, ?float $dailyRate, ?float $hourlyRate): SalarySlipLine
    {
        if ($dailyRate === null && $hourlyRate === null) {
            return new SalarySlipLine([
                'code' => SalarySlipLine::UNPAID_LEAVE,
                'label' => 'Unpaid leave',
                'amount' => $this->money(0),
                'note' => 'Taken, but there are no scheduled hours to price it against — enter an amount',
            ]);
        }

        $amount = $unpaidLeave['days'] * ($dailyRate ?? 0.0)
            + $unpaidLeave['minutes'] / 60 * ($hourlyRate ?? 0.0);

        $parts = [];
        if ($unpaidLeave['days'] > 0) {
            $parts[] = sprintf('%d day(s)', $unpaidLeave['days']);
        }
        if ($unpaidLeave['minutes'] > 0) {
            $parts[] = $this->duration($unpaidLeave['minutes']);
        }

        return new SalarySlipLine([
            'code' => SalarySlipLine::UNPAID_LEAVE,
            'label' => 'Unpaid leave',
            'amount' => $this->money(-$amount),
            'note' => implode(' · ', $parts),
        ]);
    }

    /**
     * One of the person's recurring items, or null when it does not apply to this month — a loan
     * that has not started yet, or one already paid off.
     */
    private function payrollItemLine(PayrollItem $item, string $from, string $basicSalary, int $installmentsTaken): ?SalarySlipLine
    {
        $amount = $this->schedule->amountFor($item, Carbon::parse($from), $basicSalary, $installmentsTaken);
        if ($amount === null) {
            return null;
        }

        // The item type is a required foreign key and is always eager-loaded, so it is safe to
        // reach through. Its kind decides the sign, so nothing above has to know which way it goes.
        $type = $item->type;

        return new SalarySlipLine([
            'code' => SalarySlipLine::ITEM,
            'label' => $type->name,
            'amount' => $this->money($type->kind->sign() * (float) $amount->amount),
            'note' => $amount->note,
            'payroll_item_id' => $item->id,
            'installment_number' => $amount->installmentNumber,
        ]);
    }

    /**
     * @param  list<SalarySlipLine>  $lines
     */
    private function sum(array $lines): float
    {
        return array_sum(array_map(fn (SalarySlipLine $line) => (float) $line->amount, $lines));
    }

    /**
     * Days of the period the contract actually covers; an open-ended contract covers everything
     * from its start.
     */
    private function coveredDays(EmploymentContract $contract, string $from, string $to): int
    {
        $start = Carbon::parse(max($contract->start_date->format('Y-m-d'), $from));
        $endsAt = $contract->end_date?->format('Y-m-d');
        $end = Carbon::parse($endsAt === null ? $to : min($endsAt, $to));

        // Carbon 3 counts in fractions of a day; whole days are what a month is prorated by.
        return $start->gt($end) ? 0 : (int) $start->diffInDays($end) + 1;
    }

    private function daysBetween(string $from, string $to): int
    {
        $first = Carbon::parse($from);
        $last = Carbon::parse($to);

        return $first->gt($last) ? 0 : (int) $first->diffInDays($last) + 1;
    }

    private function duration(int $minutes): string
    {
        $hours = intdiv($minutes, 60);
        $rest = $minutes % 60;

        return $rest === 0 ? sprintf('%d h', $hours) : sprintf('%d h %d m', $hours, $rest);
    }

    private function money(float $value): string
    {
        return number_format(round($value, self::SCALE), self::SCALE, '.', '');
    }
}
