<?php

declare(strict_types=1);

namespace App\Domains\Payroll\Adapters;

use App\Domains\Attendance\DTOs\LeaveUsage;
use App\Domains\Attendance\DTOs\UserShiftDTO;
use App\Domains\Attendance\Models\LeaveKind;
use App\Domains\Attendance\Models\Shift;
use App\Domains\Attendance\Repositories\LeaveKindRepository;
use App\Domains\Attendance\Repositories\ShiftRepository;
use App\Domains\Attendance\Services\AttendanceCalendarService;
use App\Domains\Attendance\Services\LeaveUsageService;
use App\Domains\Attendance\Services\UserShiftService;
use Illuminate\Database\Eloquent\Collection;
use RuntimeException;

/**
 * The Payroll domain's only door into Attendance. A salary slip needs four things from it: how long
 * a working day is, how much someone was meant to work, what they actually did, and how much leave
 * they have used.
 *
 * Shifts are read and written here rather than copied into Payroll: the hours a slip prices overtime
 * at have to be the same hours attendance measured that overtime against.
 */
readonly class AttendanceAdapter
{
    public function __construct(
        private LeaveUsageService $leaveUsageService,
        private AttendanceCalendarService $calendarService,
        private LeaveKindRepository $leaveKindRepository,
        private ShiftRepository $shiftRepository,
        private UserShiftService $userShiftService,
    ) {}

    /**
     * Leave used over the period, per kind. Taken, booked and pending are kept apart, so a
     * balance can decide for itself which of them to subtract.
     */
    public function leaveUsage(int $userId, string $from, string $to): LeaveUsage
    {
        return $this->leaveUsageService->forPeriod($userId, $from, $to);
    }

    /**
     * Minutes the person was scheduled to work, holidays excluded. Zero when they have no shift,
     * which is why every rate derived from it has to guard against dividing by it.
     */
    public function scheduledMinutes(int $userId, string $from, string $to): int
    {
        return $this->calendarService->scheduledMinutesFor($userId, $from, $to);
    }

    /**
     * How long one of the person's working days is, from their shift. Null when they have no shift
     * assignment: nothing then says what a day of theirs is worth.
     */
    public function workingDayMinutes(int $userId, string $date): ?int
    {
        return $this->calendarService->workingDayMinutesFor($userId, $date);
    }

    /**
     * What the doors actually recorded over the period, summed.
     *
     * @return array{worked_minutes: int, overtime_minutes: int, late_minutes: int, early_leave_minutes: int, leave_minutes: int, present_days: int, absent_days: int, leave_days: int, corrected_days: int}
     */
    public function attendanceTotals(int $userId, string $from, string $to): array
    {
        return $this->calendarService->periodTotals($userId, $from, $to);
    }

    /**
     * The leave kinds a contract can grant an allowance for.
     *
     * @return Collection<int, LeaveKind>
     */
    public function activeLeaveKinds(): Collection
    {
        return $this->leaveKindRepository->activeKinds();
    }

    /**
     * The shifts a contract can put someone on.
     *
     * @return Collection<int, Shift>
     */
    public function activeShifts(): Collection
    {
        return $this->shiftRepository->getActiveForSelect(null);
    }

    /** Which shift the person is on as at a date, if any. */
    public function assignedShiftId(int $userId, string $date): ?int
    {
        return $this->calendarService->assignedShiftIdOn($userId, $date);
    }

    /**
     * Put the person on a shift from a date. Attendance owns the rules — a new assignment has to
     * start after the latest one, and it closes whatever was running the day before.
     *
     * @throws RuntimeException when Attendance refuses the assignment
     */
    public function assignShift(int $userId, int $shiftId, string $effectiveFrom): void
    {
        $this->userShiftService->assign($userId, new UserShiftDTO($shiftId, $effectiveFrom));
    }
}
