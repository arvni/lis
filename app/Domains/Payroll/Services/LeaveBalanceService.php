<?php

declare(strict_types=1);

namespace App\Domains\Payroll\Services;

use App\Domains\Attendance\DTOs\LeaveUsageLine;
use App\Domains\Payroll\Adapters\AttendanceAdapter;
use App\Domains\Payroll\DTOs\LeaveBalance;
use App\Domains\Payroll\DTOs\LeaveBalanceLine;
use App\Domains\Payroll\Models\ContractLeaveEntitlement;
use App\Domains\Payroll\Models\EmploymentContract;

/**
 * What a contract grants against what has been used.
 *
 * Entitlement is a fixed total for the contract's whole duration — never a yearly rate and never
 * prorated — so the balance is counted over the contract's own run rather than a calendar year.
 *
 * Days and hours are only added together when the person's shift says how long one of their working
 * days is. Without a shift they are reported side by side instead.
 */
class LeaveBalanceService
{
    /**
     * A contract with no end date has not finished, so its leave is counted to an open bound: any
     * leave already booked ahead still comes out of the same allowance.
     */
    private const OPEN_ENDED_UNTIL = '2999-12-31';

    public function __construct(private readonly AttendanceAdapter $attendance) {}

    public function forContract(EmploymentContract $contract): LeaveBalance
    {
        $from = $contract->start_date->format('Y-m-d');
        $to = $contract->end_date?->format('Y-m-d') ?? self::OPEN_ENDED_UNTIL;
        // Taken as at the contract's start: if the shift changed part-way through, the whole run is
        // still described by one working day, which is the figure the contract was agreed on.
        $dailyMinutes = $this->attendance->workingDayMinutes($contract->user_id, $from);

        $usage = $this->attendance->leaveUsage($contract->user_id, $from, $to);

        /** @var array<int, LeaveUsageLine> $usedByKind */
        $usedByKind = [];
        foreach ($usage->kinds as $line) {
            if ($line->kindId !== null) {
                $usedByKind[$line->kindId] = $line;
            }
        }

        $lines = [];
        foreach ($contract->entitlements as $entitlement) {
            $used = $usedByKind[$entitlement->leave_kind_id] ?? null;
            unset($usedByKind[$entitlement->leave_kind_id]);
            $lines[] = $this->line($entitlement, $used, $dailyMinutes);
        }

        // Leave taken of a kind the contract grants nothing for still has to show up, or the slip
        // would quietly hide it.
        foreach ($usedByKind as $kindId => $used) {
            $lines[] = new LeaveBalanceLine(
                $kindId,
                $used->kindName,
                true,
                '0.0',
                $used->takenDays + $used->bookedDays,
                $used->takenMinutes + $used->bookedMinutes,
                $used->pendingDays,
                $used->pendingMinutes,
                $dailyMinutes,
            );
        }

        usort($lines, fn (LeaveBalanceLine $a, LeaveBalanceLine $b) => strcasecmp($a->kindName, $b->kindName));

        return new LeaveBalance($from, $to, $lines, $dailyMinutes);
    }

    /**
     * Minutes of leave used in a period for kinds that are not paid — what the salary slip deducts.
     *
     * @return array{days: int, minutes: int}
     */
    public function unpaidLeaveIn(int $userId, string $from, string $to): array
    {
        $paidByKind = [];
        foreach ($this->attendance->activeLeaveKinds() as $kind) {
            $paidByKind[$kind->id] = $kind->is_paid;
        }

        $usage = $this->attendance->leaveUsage($userId, $from, $to);

        $days = 0;
        $minutes = 0;
        foreach ($usage->kinds as $line) {
            // Only leave already approved reduces pay; a request still waiting might yet be refused.
            if ($line->kindId === null || ($paidByKind[$line->kindId] ?? true)) {
                continue;
            }
            $days += $line->takenDays;
            $minutes += $line->takenMinutes;
        }

        return ['days' => $days, 'minutes' => $minutes];
    }

    private function line(ContractLeaveEntitlement $entitlement, ?LeaveUsageLine $used, ?int $dailyMinutes): LeaveBalanceLine
    {
        return new LeaveBalanceLine(
            $entitlement->leave_kind_id,
            $entitlement->kind->name ?? 'Leave',
            (bool) ($entitlement->kind->is_paid ?? true),
            (string) $entitlement->entitled_days,
            $used === null ? 0 : $used->takenDays + $used->bookedDays,
            $used === null ? 0 : $used->takenMinutes + $used->bookedMinutes,
            $used === null ? 0 : $used->pendingDays,
            $used === null ? 0 : $used->pendingMinutes,
            $dailyMinutes,
        );
    }
}
