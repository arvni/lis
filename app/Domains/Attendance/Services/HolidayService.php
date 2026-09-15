<?php

declare(strict_types=1);

namespace App\Domains\Attendance\Services;

use App\Domains\Attendance\DTOs\HolidayDTO;
use App\Domains\Attendance\Models\Holiday;
use App\Domains\Attendance\Repositories\HolidayRepository;
use Illuminate\Pagination\LengthAwarePaginator;

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
        return $this->holidayRepository->createHoliday($dto->toArray());
    }

    public function updateHoliday(Holiday $holiday, HolidayDTO $dto): Holiday
    {
        return $this->holidayRepository->updateHoliday($holiday, $dto->toArray());
    }

    public function deleteHoliday(Holiday $holiday): void
    {
        $this->holidayRepository->deleteHoliday($holiday);
    }
}
