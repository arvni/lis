<?php

declare(strict_types=1);

namespace App\Domains\Attendance\Services;

use App\Domains\Attendance\DTOs\ShiftDTO;
use App\Domains\Attendance\Models\Shift;
use App\Domains\Attendance\Repositories\ShiftRepository;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class ShiftService
{
    public function __construct(private readonly ShiftRepository $shiftRepository) {}

    /**
     * @param  array<string, mixed>  $queryData
     * @return LengthAwarePaginator<int, Shift>
     */
    public function listShifts(array $queryData): LengthAwarePaginator
    {
        return $this->shiftRepository->listShifts($queryData);
    }

    public function storeShift(ShiftDTO $dto): Shift
    {
        return DB::transaction(function () use ($dto) {
            $shift = $this->shiftRepository->createShift($dto->toArray());
            $this->shiftRepository->replaceDays($shift, $dto->days);

            return $shift;
        });
    }

    public function updateShift(Shift $shift, ShiftDTO $dto): Shift
    {
        return DB::transaction(function () use ($shift, $dto) {
            $updated = $this->shiftRepository->updateShift($shift, $dto->toArray());
            $this->shiftRepository->replaceDays($updated, $dto->days);

            return $updated;
        });
    }

    public function deleteShift(Shift $shift): void
    {
        $this->shiftRepository->deleteShift($shift);
    }
}
