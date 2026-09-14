<?php

declare(strict_types=1);

namespace App\Domains\Attendance\Services;

use App\Domains\Attendance\DTOs\HolidayDTO;
use App\Domains\Attendance\Events\AttendanceRebuildRequested;
use App\Domains\Attendance\Models\Holiday;
use App\Domains\Attendance\Repositories\HolidayRepository;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Carbon;

class HolidayService
{
    public function __construct(private readonly HolidayRepository $holidayRepository) {}

    /**
     * @param  array<string, mixed>  $queryData
     * @return LengthAwarePaginator<int, Holiday>
     */
    public function listHolidays(array $queryData): LengthAwarePaginator
    {
        return $this->holidayRepository->listHolidays($queryData);
    }

    public function storeHoliday(HolidayDTO $dto): Holiday
    {
        $holiday = $this->holidayRepository->createHoliday($dto->toArray());
        $this->recalculate($dto->date);

        return $holiday;
    }

    public function updateHoliday(Holiday $holiday, HolidayDTO $dto): Holiday
    {
        $previousDate = $holiday->date->format('Y-m-d');
        $updated = $this->holidayRepository->updateHoliday($holiday, $dto->toArray());

        if ($previousDate !== $dto->date) {
            $this->recalculate($previousDate);
            $this->recalculate($dto->date);
        }

        return $updated;
    }

    public function deleteHoliday(Holiday $holiday): void
    {
        $date = $holiday->date->format('Y-m-d');
        $this->holidayRepository->deleteHoliday($holiday);
        $this->recalculate($date);
    }

    /**
     * A day already judged against the old calendar is recalculated; days still to come are judged
     * when they arrive.
     */
    private function recalculate(string $date): void
    {
        if ($date <= Carbon::today()->toDateString()) {
            AttendanceRebuildRequested::dispatch($date, $date);
        }
    }
}
