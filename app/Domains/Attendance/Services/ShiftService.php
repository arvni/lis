<?php

declare(strict_types=1);

namespace App\Domains\Attendance\Services;

use App\Domains\Attendance\DTOs\ShiftDTO;
use App\Domains\Attendance\Models\Shift;
use App\Domains\Attendance\Repositories\ShiftRepository;
use App\Domains\Attendance\Repositories\UserShiftRepository;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class ShiftService
{
    public function __construct(
        private readonly ShiftRepository $shiftRepository,
        private readonly UserShiftRepository $userShiftRepository,
    ) {}

    /**
     * @return Collection<int, Shift>
     */
    public function listActiveShiftsForSelect(?string $search): Collection
    {
        return $this->shiftRepository->getActiveForSelect($search);
    }

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

    /**
     * @throws RuntimeException while any assignment, past or present, uses the shift
     */
    public function deleteShift(Shift $shift): void
    {
        // Past attendance is judged against the shifts people had then, so a shift in use stays.
        if ($this->userShiftRepository->existsForShift($shift->id)) {
            throw new RuntimeException("$shift->name is assigned to users, so it can't be deleted. Mark it inactive instead.");
        }

        $this->shiftRepository->deleteShift($shift);
    }
}
