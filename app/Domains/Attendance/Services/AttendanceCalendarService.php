<?php

declare(strict_types=1);

namespace App\Domains\Attendance\Services;

use App\Domains\Attendance\Adapters\UserAdapter;
use App\Domains\Attendance\DTOs\CalendarDay;
use App\Domains\Attendance\DTOs\CalendarMonth;
use App\Domains\Attendance\DTOs\ShiftHours;
use App\Domains\Attendance\Enums\AttendanceStatus;
use App\Domains\Attendance\Models\LeaveRequest;
use App\Domains\Attendance\Models\ShiftDay;
use App\Domains\Attendance\Models\UserShift;
use App\Domains\Attendance\Repositories\AttendanceDayChangeRepository;
use App\Domains\Attendance\Repositories\AttendanceDayRepository;
use App\Domains\Attendance\Repositories\HolidayRepository;
use App\Domains\Attendance\Repositories\LeaveRequestRepository;
use App\Domains\Attendance\Repositories\UserShiftRepository;
use App\Domains\User\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Carbon;

/**
 * A person's month: the shift hours planned for each day, holidays and leave, what the doors
 * recorded and how it was corrected. Future days show the plan only.
 */
class AttendanceCalendarService
{
    public function __construct(
        private readonly UserShiftRepository $userShiftRepository,
        private readonly HolidayRepository $holidayRepository,
        private readonly LeaveRequestRepository $leaveRepository,
        private readonly AttendanceDayRepository $dayRepository,
        private readonly AttendanceDayChangeRepository $changeRepository,
        private readonly ShiftSchedule $schedule,
        private readonly UserAdapter $userAdapter,
    ) {}

    public function findPerson(int $userId): User
    {
        return $this->userAdapter->findUserOrFail($userId);
    }

    /**
     * @return Collection<int, User>
     */
    public function searchPeople(?string $search): Collection
    {
        return $this->userAdapter->searchActiveUsers($search);
    }

    public function month(int $userId, Carbon $month): CalendarMonth
    {
        [$first, $last] = $this->bounds($month);
        $from = $first->toDateString();
        $to = $last->toDateString();

        $assignments = $this->userShiftRepository->overlapping($from, $to, [$userId]);
        $holidays = $this->holidayRepository->holidaysBetween($from, $to);
        $leaves = $this->leaveRepository->activeForUserBetween($userId, $from, $to);
        $records = $this->dayRepository->forUserBetween($userId, $from, $to);
        $changes = $this->changeRepository->forUserBetween($userId, $from, $to);

        $totals = [
            'scheduled_minutes' => 0,
            'worked_minutes' => 0,
            'overtime_minutes' => 0,
            'late_minutes' => 0,
            'early_leave_minutes' => 0,
            'leave_minutes' => 0,
            'present_days' => 0,
            'absent_days' => 0,
            'leave_days' => 0,
            'corrected_days' => 0,
        ];

        $days = [];
        for ($date = $first->copy(); $date->lte($last); $date = $date->copy()->addDay()) {
            $key = $date->toDateString();
            $assignment = $this->schedule->assignmentOn($assignments, $date);
            $hours = $assignment ? $this->schedule->hoursOn($assignment->shift, $date) : null;
            $holiday = $holidays[$key] ?? null;
            $scheduled = $hours !== null && $holiday === null ? $this->schedule->minutesOf($hours) : 0;
            $record = $records[$key] ?? null;

            $totals['scheduled_minutes'] += $scheduled;
            if ($record !== null) {
                $totals['worked_minutes'] += $record->worked_minutes;
                $totals['overtime_minutes'] += $record->overtime_minutes;
                $totals['late_minutes'] += $record->late_minutes;
                $totals['early_leave_minutes'] += $record->early_leave_minutes;
                $totals['leave_minutes'] += $record->leave_minutes;
                $totals['corrected_days'] += $record->is_manual ? 1 : 0;
                match ($record->status) {
                    AttendanceStatus::PRESENT, AttendanceStatus::INCOMPLETE => $totals['present_days']++,
                    AttendanceStatus::ABSENT => $totals['absent_days']++,
                    AttendanceStatus::LEAVE => $totals['leave_days']++,
                    default => null,
                };
            }

            $days[] = new CalendarDay(
                $date->copy(),
                $assignment,
                $hours,
                $holiday,
                array_values($leaves->filter(
                    fn (LeaveRequest $leave) => $leave->start_date->lte($date) && $leave->end_date->gte($date)
                )->all()),
                $record,
                $scheduled,
                $changes[$key] ?? [],
            );
        }

        return new CalendarMonth($first, $days, $totals);
    }

    /**
     * One row per person with a shift or recorded days in the month, by name.
     *
     * @return list<array{name: string, attendance_number: string|null, scheduled_minutes: int, worked_minutes: int, overtime_minutes: int, late_minutes: int, early_leave_minutes: int, leave_minutes: int, present_days: int, absent_days: int, leave_days: int, corrected_days: int}>
     */
    public function monthSummary(Carbon $month): array
    {
        [$first, $last] = $this->bounds($month);
        $from = $first->toDateString();
        $to = $last->toDateString();

        $assignmentsByUser = [];
        foreach ($this->userShiftRepository->overlapping($from, $to, null) as $assignment) {
            $assignmentsByUser[$assignment->user_id][] = $assignment;
        }
        $holidays = $this->holidayRepository->holidaysBetween($from, $to);
        $totalsByUser = $this->dayRepository->totalsByUserBetween($from, $to);

        $userIds = array_values(array_unique([...array_keys($assignmentsByUser), ...array_keys($totalsByUser)]));
        $users = $this->userAdapter->getUsersByIds($userIds);

        $rows = [];
        foreach ($userIds as $userId) {
            $user = $users[$userId] ?? null;
            if ($user === null) {
                continue;
            }
            $totals = $totalsByUser[$userId] ?? [];

            $rows[] = [
                'name' => $user->name,
                'attendance_number' => $user->attendance_number,
                'scheduled_minutes' => $this->scheduledMinutes($assignmentsByUser[$userId] ?? [], $holidays, $first, $last),
                'worked_minutes' => $totals['worked_minutes'] ?? 0,
                'overtime_minutes' => $totals['overtime_minutes'] ?? 0,
                'late_minutes' => $totals['late_minutes'] ?? 0,
                'early_leave_minutes' => $totals['early_leave_minutes'] ?? 0,
                'leave_minutes' => $totals['leave_minutes'] ?? 0,
                'present_days' => $totals['present_days'] ?? 0,
                'absent_days' => $totals['absent_days'] ?? 0,
                'leave_days' => $totals['leave_days'] ?? 0,
                'corrected_days' => $totals['corrected_days'] ?? 0,
            ];
        }

        usort($rows, fn (array $a, array $b) => strcasecmp($a['name'], $b['name']));

        return $rows;
    }

    /**
     * The minutes one person was meant to work between two dates, holidays left out. Asked for by
     * anything that needs to turn a salary into an hourly rate.
     */
    public function scheduledMinutesFor(int $userId, string $from, string $to): int
    {
        $assignments = array_values($this->userShiftRepository->overlapping($from, $to, [$userId])->all());
        $holidays = $this->holidayRepository->holidaysBetween($from, $to);

        return $this->scheduledMinutes($assignments, $holidays, Carbon::parse($from), Carbon::parse($to));
    }

    /**
     * One person's recorded days between two dates, summed. All zeroes when nothing is recorded.
     *
     * @return array{worked_minutes: int, overtime_minutes: int, late_minutes: int, early_leave_minutes: int, leave_minutes: int, present_days: int, absent_days: int, leave_days: int, corrected_days: int}
     */
    public function periodTotals(int $userId, string $from, string $to): array
    {
        $totals = $this->dayRepository->totalsByUserBetween($from, $to, [$userId]);

        return $totals[$userId] ?? [
            'worked_minutes' => 0,
            'overtime_minutes' => 0,
            'late_minutes' => 0,
            'early_leave_minutes' => 0,
            'leave_minutes' => 0,
            'present_days' => 0,
            'absent_days' => 0,
            'leave_days' => 0,
            'corrected_days' => 0,
        ];
    }

    /** The shift the person is assigned on a date, if any. */
    public function assignedShiftIdOn(int $userId, string $date): ?int
    {
        $assignments = array_values($this->userShiftRepository->overlapping($date, $date, [$userId])->all());

        return $this->schedule->assignmentOn($assignments, Carbon::parse($date))?->shift_id;
    }

    /**
     * How long one working day is for the person on a date, averaged over the days their shift
     * actually covers — a shift of four 10-hour days has 10-hour days, not 8-hour ones.
     *
     * Null when they have no shift assignment then: nothing says what a day of theirs is worth, and
     * inventing a figure would make a salary slip look authoritative while resting on a guess.
     */
    public function workingDayMinutesFor(int $userId, string $date): ?int
    {
        $assignments = array_values($this->userShiftRepository->overlapping($date, $date, [$userId])->all());
        $assignment = $this->schedule->assignmentOn($assignments, Carbon::parse($date));
        if ($assignment === null) {
            return null;
        }

        $minutes = 0;
        $days = 0;
        foreach ($assignment->shift->days as $day) {
            /** @var ShiftDay $day */
            $minutes += $this->schedule->minutesOf(new ShiftHours($day->start_time, $day->end_time));
            $days++;
        }

        return $days === 0 ? null : intdiv($minutes, $days);
    }

    /**
     * @param  list<UserShift>  $assignments
     * @param  array<string, mixed>  $holidays  keyed by Y-m-d
     */
    private function scheduledMinutes(array $assignments, array $holidays, Carbon $first, Carbon $last): int
    {
        $minutes = 0;
        for ($date = $first->copy(); $date->lte($last); $date = $date->copy()->addDay()) {
            if (isset($holidays[$date->toDateString()])) {
                continue;
            }
            $assignment = $this->schedule->assignmentOn($assignments, $date);
            $hours = $assignment ? $this->schedule->hoursOn($assignment->shift, $date) : null;
            $minutes += $hours ? $this->schedule->minutesOf($hours) : 0;
        }

        return $minutes;
    }

    /**
     * @return array{0: Carbon, 1: Carbon} the first and last day of the month
     */
    private function bounds(Carbon $month): array
    {
        return [$month->copy()->startOfMonth()->startOfDay(), $month->copy()->endOfMonth()->startOfDay()];
    }
}
