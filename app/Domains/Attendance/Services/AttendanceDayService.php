<?php

declare(strict_types=1);

namespace App\Domains\Attendance\Services;

use App\Domains\Attendance\DTOs\AttendanceCorrectionDTO;
use App\Domains\Attendance\DTOs\ShiftHours;
use App\Domains\Attendance\Enums\AttendanceStatus;
use App\Domains\Attendance\Models\AttendanceDay;
use App\Domains\Attendance\Repositories\AttendanceDayRepository;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Carbon;
use LogicException;

class AttendanceDayService
{
    public function __construct(
        private readonly AttendanceDayRepository $dayRepository,
        private readonly AttendanceDayCalculator $calculator,
        private readonly AttendanceProcessingService $processingService,
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

        // A corrected day is settled, so judge it as a day that is over.
        $result = $this->calculator->calculate(
            $date,
            $hours,
            $day->status === AttendanceStatus::HOLIDAY,
            $punches,
            [],
            $date->copy()->addDay(),
        ) ?? throw new LogicException('A day that is over always has a result.');

        return $this->dayRepository->update($day, [
            'check_in' => $result->checkIn,
            'check_out' => $result->checkOut,
            'status' => $result->status,
            'late_minutes' => $result->lateMinutes,
            'early_leave_minutes' => $result->earlyLeaveMinutes,
            'worked_minutes' => $result->workedMinutes,
            'is_manual' => true,
            'note' => $dto->note,
            'corrected_by' => $correctedBy,
            'corrected_at' => Carbon::now(),
        ]);
    }

    /**
     * Hand a corrected day back to the scheduled job and recalculate it from the punches now.
     */
    public function resetToAutomatic(AttendanceDay $day): void
    {
        $this->dayRepository->update($day, [
            'is_manual' => false,
            'note' => null,
            'corrected_by' => null,
            'corrected_at' => null,
        ]);

        $this->processingService->rebuild($day->date, $day->date, [$day->user_id]);
    }
}
