<?php

declare(strict_types=1);

namespace App\Domains\Attendance\Services;

use App\Domains\Attendance\DTOs\AttendanceCorrectionDTO;
use App\Domains\Attendance\DTOs\ShiftHours;
use App\Domains\Attendance\Enums\AttendanceChangeAction;
use App\Domains\Attendance\Enums\AttendanceStatus;
use App\Domains\Attendance\Models\AttendanceDay;
use App\Domains\Attendance\Repositories\AttendanceDayChangeRepository;
use App\Domains\Attendance\Repositories\AttendanceDayRepository;
use App\Domains\Attendance\Repositories\LeaveRequestRepository;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use LogicException;

class AttendanceDayService
{
    public function __construct(
        private readonly AttendanceDayRepository $dayRepository,
        private readonly AttendanceDayCalculator $calculator,
        private readonly AttendanceProcessingService $processingService,
        private readonly LeaveRequestRepository $leaveRepository,
        private readonly LeaveCoverage $leaveCoverage,
        private readonly AttendanceDayChangeRepository $changeRepository,
    ) {}

    /**
     * @param  array<string, mixed>  $queryData
     * @return LengthAwarePaginator<int, AttendanceDay>
     */
    public function listDays(array $queryData): LengthAwarePaginator
    {
        return $this->dayRepository->listDays($queryData);
    }

    /**
     * @param  array<string, mixed>  $queryData
     * @return Collection<int, AttendanceDay>
     */
    public function listAllDays(array $queryData): Collection
    {
        return $this->dayRepository->allDays($queryData);
    }

    /**
     * Set a day's check-in and check-out by hand. Status and minutes are recalculated against the
     * hours the day was judged by, and the scheduled job leaves the day alone from then on.
     */
    public function correct(AttendanceDay $day, AttendanceCorrectionDTO $dto, int $correctedBy): AttendanceDay
    {
        $before = $this->snapshot($day);
        $date = $day->date->copy()->startOfDay();
        $punches = [];
        foreach ([$dto->checkIn, $dto->checkOut] as $time) {
            if ($time !== null) {
                $punches[] = $date->copy()->setTimeFromTimeString($time);
            }
        }

        $hours = $day->scheduled_start !== null && $day->scheduled_end !== null
            ? new ShiftHours($day->scheduled_start, $day->scheduled_end)
            : null;

        $excused = $hours === null ? [] : $this->leaveCoverage->excusedOn(
            $this->leaveRepository->approvedBetween($date->toDateString(), $date->toDateString(), [$day->user_id]),
            $date,
            $hours,
        );

        // A corrected day is settled, so judge it as a day that is over.
        $result = $this->calculator->calculate(
            $date,
            $hours,
            $day->status === AttendanceStatus::HOLIDAY,
            $punches,
            $excused,
            $date->copy()->addDay(),
        ) ?? throw new LogicException('A day that is over always has a result.');

        return DB::transaction(function () use ($day, $result, $dto, $correctedBy, $before) {
            $updated = $this->dayRepository->update($day, [
                'check_in' => $result->checkIn,
                'check_out' => $result->checkOut,
                'status' => $result->status,
                'late_minutes' => $result->lateMinutes,
                'early_leave_minutes' => $result->earlyLeaveMinutes,
                'worked_minutes' => $result->workedMinutes,
                'leave_minutes' => $result->leaveMinutes,
                'is_manual' => true,
                'note' => $dto->note,
                'corrected_by' => $correctedBy,
                'corrected_at' => Carbon::now(),
            ]);

            $this->changeRepository->record([
                'attendance_day_id' => $updated->id,
                'user_id' => $updated->user_id,
                'date' => $updated->date->toDateString(),
                'action' => AttendanceChangeAction::CORRECTED,
                'before' => $before,
                'after' => $this->snapshot($updated),
                'note' => $dto->note,
                'changed_by' => $correctedBy,
            ]);

            return $updated;
        });
    }

    /**
     * Hand a corrected day back to the scheduled job and recalculate it from the punches now.
     */
    public function resetToAutomatic(AttendanceDay $day, int $resetBy): void
    {
        $before = $this->snapshot($day);
        $dayId = $day->id;
        $userId = $day->user_id;
        $date = $day->date->copy();

        $this->dayRepository->update($day, [
            'is_manual' => false,
            'note' => null,
            'corrected_by' => null,
            'corrected_at' => null,
        ]);

        $this->processingService->rebuild($date, $date, [$userId]);

        // The day may be gone: without a shift or punches it no longer applies.
        $after = $this->dayRepository->findById($dayId);
        $this->changeRepository->record([
            'attendance_day_id' => $after?->id,
            'user_id' => $userId,
            'date' => $date->toDateString(),
            'action' => AttendanceChangeAction::RESET,
            'before' => $before,
            'after' => $after ? $this->snapshot($after) : null,
            'note' => null,
            'changed_by' => $resetBy,
        ]);
    }

    /**
     * The parts of a day a hand edit can change, as stored in the change log.
     *
     * @return array{check_in: string|null, check_out: string|null, status: string, late_minutes: int, early_leave_minutes: int, worked_minutes: int, leave_minutes: int}
     */
    private function snapshot(AttendanceDay $day): array
    {
        return [
            'check_in' => $day->check_in?->format('H:i:s'),
            'check_out' => $day->check_out?->format('H:i:s'),
            'status' => $day->status->value,
            'late_minutes' => $day->late_minutes,
            'early_leave_minutes' => $day->early_leave_minutes,
            'worked_minutes' => $day->worked_minutes,
            'leave_minutes' => $day->leave_minutes,
        ];
    }
}
