<?php

declare(strict_types=1);

namespace App\Domains\Attendance\Services;

use App\Domains\Attendance\Adapters\UserAdapter;
use App\Domains\Attendance\DTOs\CountedLeave;
use App\Domains\Attendance\DTOs\LeaveUsage;
use App\Domains\Attendance\DTOs\LeaveUsageLine;
use App\Domains\Attendance\DTOs\ShiftHours;
use App\Domains\Attendance\Enums\LeaveRequestStatus;
use App\Domains\Attendance\Enums\LeaveType;
use App\Domains\Attendance\Models\Holiday;
use App\Domains\Attendance\Models\LeaveRequest;
use App\Domains\Attendance\Models\UserShift;
use App\Domains\Attendance\Repositories\HolidayRepository;
use App\Domains\Attendance\Repositories\LeaveRequestRepository;
use App\Domains\Attendance\Repositories\UserShiftRepository;
use App\Domains\User\Models\User;
use Illuminate\Support\Carbon;

/**
 * How much leave people have used over a period, per leave kind. The period is usually a calendar
 * year, but anything can be asked for — a contract's duration, say.
 *
 * Full-day leave counts the working days it covers: days the person's shift has hours, minus holidays.
 * On dates without any shift assignment every day except holidays counts. Hourly leave counts its
 * minutes inside that day's shift hours (all of its minutes on a date without a shift).
 *
 * Approved leave on or before today is taken, approved leave after today is booked, and requests
 * still waiting for approval are pending. Rejected and cancelled requests don't count.
 */
class LeaveUsageService
{
    public function __construct(
        private readonly LeaveRequestRepository $leaveRepository,
        private readonly UserShiftRepository $userShiftRepository,
        private readonly HolidayRepository $holidayRepository,
        private readonly ShiftSchedule $schedule,
        private readonly LeaveCoverage $leaveCoverage,
        private readonly UserAdapter $userAdapter,
    ) {}

    public function findPerson(int $userId): User
    {
        return $this->userAdapter->findUserOrFail($userId);
    }

    public function forPerson(int $userId, int $year, ?Carbon $today = null): LeaveUsage
    {
        [$from, $to] = $this->bounds($year);

        return $this->forPeriod($userId, $from, $to, $today);
    }

    /**
     * The same count over any period, e.g. the run of an employment contract.
     *
     * @param  string  $from  first day, Y-m-d
     * @param  string  $to  last day, Y-m-d
     */
    public function forPeriod(int $userId, string $from, string $to, ?Carbon $today = null): LeaveUsage
    {
        $today = ($today ?? Carbon::today())->copy()->startOfDay();

        $assignments = array_values($this->userShiftRepository->overlapping($from, $to, [$userId])->all());
        $holidays = $this->holidayRepository->holidaysBetween($from, $to);

        $counted = [];
        foreach ($this->leaveRepository->activeForUserBetween($userId, $from, $to) as $leave) {
            $counted[] = $this->count($leave, $assignments, $holidays, $from, $to, $today);
        }

        return $this->usage($from, $to, $counted);
    }

    /**
     * Everyone with approved or pending leave in the year, by name.
     *
     * @return list<array{user: User, usage: LeaveUsage}>
     */
    public function staffSummary(int $year, ?Carbon $today = null): array
    {
        $today = ($today ?? Carbon::today())->copy()->startOfDay();
        [$from, $to] = $this->bounds($year);

        $leavesByUser = [];
        foreach ($this->leaveRepository->activeBetween($from, $to) as $leave) {
            $leavesByUser[$leave->user_id][] = $leave;
        }
        if ($leavesByUser === []) {
            return [];
        }

        $userIds = array_keys($leavesByUser);
        $assignmentsByUser = [];
        foreach ($this->userShiftRepository->overlapping($from, $to, $userIds) as $assignment) {
            $assignmentsByUser[$assignment->user_id][] = $assignment;
        }
        $holidays = $this->holidayRepository->holidaysBetween($from, $to);
        $users = $this->userAdapter->getUsersByIds($userIds);

        $rows = [];
        foreach ($leavesByUser as $userId => $leaves) {
            $user = $users[$userId] ?? null;
            if ($user === null) {
                continue;
            }

            $counted = array_map(
                fn (LeaveRequest $leave) => $this->count($leave, $assignmentsByUser[$userId] ?? [], $holidays, $from, $to, $today),
                $leaves,
            );
            $rows[] = ['user' => $user, 'usage' => $this->usage($from, $to, $counted)];
        }

        usort($rows, fn (array $a, array $b) => strcasecmp($a['user']->name, $b['user']->name));

        return $rows;
    }

    /**
     * @param  list<UserShift>  $assignments  the person's assignments
     * @param  array<string, Holiday>  $holidays  keyed by Y-m-d
     */
    private function count(LeaveRequest $leave, array $assignments, array $holidays, string $from, string $to, Carbon $today): CountedLeave
    {
        // Leave can start before the period or end after it; only the part inside counts.
        $first = Carbon::parse(max($leave->start_date->toDateString(), $from));
        $last = Carbon::parse(min($leave->end_date->toDateString(), $to));

        $days = ['past' => 0, 'future' => 0];
        $minutes = ['past' => 0, 'future' => 0];
        for ($date = $first; $date->lte($last); $date = $date->copy()->addDay()) {
            if (isset($holidays[$date->toDateString()])) {
                continue;
            }

            $assignment = $this->schedule->assignmentOn($assignments, $date);
            $hours = $assignment ? $this->schedule->hoursOn($assignment->shift, $date) : null;
            if ($assignment !== null && $hours === null) {
                // A day off on the person's shift doesn't use up leave.
                continue;
            }

            $part = $date->lte($today) ? 'past' : 'future';
            if ($leave->type === LeaveType::DAILY) {
                $days[$part]++;
            } else {
                $minutes[$part] += $this->hourlyMinutes($leave, $date, $hours);
            }
        }

        return new CountedLeave($leave, $days['past'], $minutes['past'], $days['future'], $minutes['future']);
    }

    private function hourlyMinutes(LeaveRequest $leave, Carbon $date, ?ShiftHours $hours): int
    {
        if ($hours === null) {
            return $this->schedule->minutesOf(new ShiftHours((string) $leave->start_time, (string) $leave->end_time));
        }

        $minutes = 0;
        foreach ($this->leaveCoverage->excusedOn([$leave], $date, $hours) as $range) {
            $minutes += intdiv($range->end->getTimestamp() - $range->start->getTimestamp(), 60);
        }

        return $minutes;
    }

    /**
     * @param  list<CountedLeave>  $counted
     */
    private function usage(string $from, string $to, array $counted): LeaveUsage
    {
        $empty = ['taken_days' => 0, 'taken_minutes' => 0, 'booked_days' => 0, 'booked_minutes' => 0, 'pending_days' => 0, 'pending_minutes' => 0];
        $byKind = [];
        $names = [];
        $total = $empty;

        foreach ($counted as $item) {
            $kindId = $item->leave->leave_kind_id;
            $names[$kindId] = $item->leave->kind->name ?? 'Leave';
            $amounts = $item->leave->status === LeaveRequestStatus::APPROVED
                ? ['taken_days' => $item->pastDays, 'taken_minutes' => $item->pastMinutes, 'booked_days' => $item->futureDays, 'booked_minutes' => $item->futureMinutes]
                : ['pending_days' => $item->days(), 'pending_minutes' => $item->minutes()];

            $byKind[$kindId] ??= $empty;
            foreach ($amounts as $key => $value) {
                $byKind[$kindId][$key] += $value;
                $total[$key] += $value;
            }
        }

        $kinds = [];
        foreach ($byKind as $kindId => $amounts) {
            $kinds[] = $this->line($kindId, $names[$kindId], $amounts);
        }
        usort($kinds, fn (LeaveUsageLine $a, LeaveUsageLine $b) => strcasecmp($a->kindName, $b->kindName));

        return new LeaveUsage($from, $to, $kinds, $this->line(null, 'Total', $total), $counted);
    }

    /**
     * @param  array{taken_days: int, taken_minutes: int, booked_days: int, booked_minutes: int, pending_days: int, pending_minutes: int}  $amounts
     */
    private function line(?int $kindId, string $name, array $amounts): LeaveUsageLine
    {
        return new LeaveUsageLine(
            $kindId,
            $name,
            $amounts['taken_days'],
            $amounts['taken_minutes'],
            $amounts['booked_days'],
            $amounts['booked_minutes'],
            $amounts['pending_days'],
            $amounts['pending_minutes'],
        );
    }

    /**
     * @return array{0: string, 1: string} the year's first and last day, Y-m-d
     */
    private function bounds(int $year): array
    {
        return [sprintf('%04d-01-01', $year), sprintf('%04d-12-31', $year)];
    }
}
