<?php

declare(strict_types=1);

namespace App\Domains\Attendance\Services;

use App\Domains\Attendance\Adapters\UserAdapter;
use App\Domains\Attendance\DTOs\ShiftHours;
use App\Domains\Attendance\Models\Shift;
use App\Domains\Attendance\Models\ShiftDay;
use App\Domains\Attendance\Models\UserShift;
use App\Domains\Attendance\Repositories\AttendanceDayRepository;
use App\Domains\Attendance\Repositories\AttendanceTransactionRepository;
use App\Domains\Attendance\Repositories\HolidayRepository;
use App\Domains\Attendance\Repositories\LeaveRequestRepository;
use App\Domains\Attendance\Repositories\UserShiftRepository;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Turns HikCentral punches into attendance_days rows for a range of dates.
 *
 * Safe to run again and again: each run recalculates the range from scratch, leaves days corrected
 * by hand alone, and removes rows that no longer apply (e.g. a shift assignment was removed).
 */
class AttendanceProcessingService
{
    public function __construct(
        private readonly AttendanceDayCalculator $calculator,
        private readonly AttendanceDayRepository $dayRepository,
        private readonly UserShiftRepository $userShiftRepository,
        private readonly HolidayRepository $holidayRepository,
        private readonly AttendanceTransactionRepository $transactionRepository,
        private readonly UserAdapter $userAdapter,
        private readonly LeaveRequestRepository $leaveRepository,
        private readonly LeaveCoverage $leaveCoverage,
    ) {}

    /**
     * Recalculate every day from `$from` to `$to` (inclusive; days after today are skipped).
     *
     * A person gets a row on a day when they have a shift assigned that day or punched that day.
     *
     * @param  list<int>|null  $userIds  only these users (null = everyone)
     * @return int how many days were written
     */
    public function rebuild(Carbon $from, Carbon $to, ?array $userIds = null, ?Carbon $now = null): int
    {
        $now ??= Carbon::now();
        $today = $now->copy()->startOfDay();
        $from = $from->copy()->startOfDay();
        $to = $to->copy()->startOfDay();
        if ($to->gt($today)) {
            $to = $today;
        }
        if ($from->gt($to)) {
            return 0;
        }

        $fromDate = $from->toDateString();
        $toDate = $to->toDateString();

        $assignmentsByUser = [];
        foreach ($this->userShiftRepository->overlapping($fromDate, $toDate, $userIds) as $assignment) {
            $assignmentsByUser[$assignment->user_id][] = $assignment;
        }

        $holidays = array_flip($this->holidayRepository->datesBetween($fromDate, $toDate));
        $punches = $this->punchesByUserAndDay($from, $to, $userIds);
        $existing = $this->dayRepository->existingKeys($fromDate, $toDate, $userIds);

        $leavesByUser = [];
        foreach ($this->leaveRepository->approvedBetween($fromDate, $toDate, $userIds) as $leave) {
            $leavesByUser[$leave->user_id][] = $leave;
        }

        $userIdsInRange = array_values(array_unique([
            ...array_keys($assignmentsByUser),
            ...array_keys($punches),
            ...($userIds ?? []),
        ]));

        $rows = [];
        $current = [];
        foreach ($userIdsInRange as $userId) {
            for ($date = $from->copy(); $date->lte($to); $date = $date->copy()->addDay()) {
                $day = $date->toDateString();
                $key = "$userId|$day";

                if ($existing[$key]['is_manual'] ?? false) {
                    $current[$key] = true;

                    continue;
                }

                $assignment = $this->assignmentOn($assignmentsByUser[$userId] ?? [], $date);
                $dayPunches = $punches[$userId][$day] ?? [];
                if ($assignment === null && $dayPunches === []) {
                    continue;
                }

                $hours = $assignment ? $this->hoursOn($assignment->shift, $date) : null;
                $excused = $hours ? $this->leaveCoverage->excusedOn($leavesByUser[$userId] ?? [], $date, $hours) : [];
                $result = $this->calculator->calculate($date->copy(), $hours, isset($holidays[$day]), $dayPunches, $excused, $now);
                if ($result === null) {
                    continue;
                }

                $current[$key] = true;
                $rows[] = [
                    'user_id' => $userId,
                    'date' => $day,
                    'shift_id' => $assignment?->shift_id,
                    'scheduled_start' => $hours?->start,
                    'scheduled_end' => $hours?->end,
                    'check_in' => $result->checkIn?->format('Y-m-d H:i:s'),
                    'check_out' => $result->checkOut?->format('Y-m-d H:i:s'),
                    'status' => $result->status->value,
                    'late_minutes' => $result->lateMinutes,
                    'early_leave_minutes' => $result->earlyLeaveMinutes,
                    'worked_minutes' => $result->workedMinutes,
                    'leave_minutes' => $result->leaveMinutes,
                    'is_manual' => false,
                    'note' => null,
                    'corrected_by' => null,
                    'corrected_at' => null,
                ];
            }
        }

        $stale = [];
        foreach ($existing as $key => $day) {
            if (! isset($current[$key]) && ! $day['is_manual']) {
                $stale[] = $day['id'];
            }
        }

        DB::transaction(function () use ($rows, $stale) {
            $this->dayRepository->upsertCalculated($rows);
            $this->dayRepository->deleteCalculated($stale);
        });

        return count($rows);
    }

    /**
     * @param  list<int>|null  $userIds
     * @return array<int, array<string, list<Carbon>>> punches keyed by user id, then Y-m-d
     */
    private function punchesByUserAndDay(Carbon $from, Carbon $to, ?array $userIds): array
    {
        $attendanceIds = $userIds === null
            ? null
            : array_values($this->userAdapter->getAttendanceNumbersForUsers($userIds));
        if ($attendanceIds === []) {
            return [];
        }

        $transactions = $this->transactionRepository->punchesBetween($from, $to, $attendanceIds);

        $numbers = [];
        foreach ($transactions as $transaction) {
            $numbers[$transaction->attendance_id] = true;
        }
        $users = $this->userAdapter->getUsersByAttendanceNumbers(array_map('strval', array_keys($numbers)));

        $punches = [];
        foreach ($transactions as $transaction) {
            // An Employee ID no LIS user has yet: kept in the punches table, not attendance.
            $user = $users[$transaction->attendance_id] ?? null;
            if ($user === null) {
                continue;
            }
            $punches[$user->id][$transaction->access_date_and_time->toDateString()][] = $transaction->access_date_and_time;
        }

        return $punches;
    }

    /**
     * @param  list<UserShift>  $assignments
     */
    private function assignmentOn(array $assignments, Carbon $date): ?UserShift
    {
        foreach ($assignments as $assignment) {
            if ($assignment->effective_from->lte($date)
                && ($assignment->effective_to === null || $assignment->effective_to->gte($date))) {
                return $assignment;
            }
        }

        return null;
    }

    private function hoursOn(Shift $shift, Carbon $date): ?ShiftHours
    {
        $day = $shift->days->first(fn (ShiftDay $shiftDay) => $shiftDay->weekday->value === $date->dayOfWeek);

        return $day ? new ShiftHours($day->start_time, $day->end_time) : null;
    }
}
