<?php

declare(strict_types=1);

namespace App\Domains\Attendance\Services;

use App\Domains\Attendance\DTOs\UserShiftDTO;
use App\Domains\Attendance\Models\UserShift;
use App\Domains\Attendance\Repositories\UserShiftRepository;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class UserShiftService
{
    public function __construct(private readonly UserShiftRepository $userShiftRepository) {}

    /**
     * @return Collection<int, UserShift> newest first
     */
    public function listAssignments(int $userId): Collection
    {
        return $this->userShiftRepository->listForUser($userId);
    }

    /**
     * Start a shift for the user on a date. Whatever assignment is still running then ends the day
     * before, so a user never has two shifts on the same day.
     *
     * @throws RuntimeException when the new shift would not start after the latest assignment does
     */
    public function assign(int $userId, UserShiftDTO $dto): UserShift
    {
        return DB::transaction(function () use ($userId, $dto) {
            $latest = $this->userShiftRepository->latestForUser($userId);
            $from = Carbon::parse($dto->effectiveFrom)->startOfDay();

            if ($latest) {
                if ($from->lte($latest->effective_from)) {
                    throw new RuntimeException(
                        'A new shift has to start after '.$latest->effective_from->format('Y-m-d').', when this user’s latest shift starts.'
                    );
                }

                $dayBefore = $from->copy()->subDay();
                if ($latest->effective_to === null || $latest->effective_to->gt($dayBefore)) {
                    $this->userShiftRepository->update($latest, ['effective_to' => $dayBefore->toDateString()]);
                }
            }

            return $this->userShiftRepository->create([
                'user_id' => $userId,
                'shift_id' => $dto->shiftId,
                'effective_from' => $from->toDateString(),
                'effective_to' => $dto->effectiveTo,
            ]);
        });
    }

    /**
     * Undo the latest assignment. If it had cut the previous assignment short, that one runs on again.
     *
     * @throws RuntimeException for any assignment other than the user's latest
     */
    public function removeAssignment(UserShift $assignment): void
    {
        DB::transaction(function () use ($assignment) {
            $latest = $this->userShiftRepository->latestForUser($assignment->user_id);
            if ($latest?->id !== $assignment->id) {
                throw new RuntimeException('Only the latest shift assignment can be removed.');
            }

            $previous = $this->userShiftRepository->previousFor($assignment);
            $this->userShiftRepository->delete($assignment);

            $endedByThisOne = $previous?->effective_to?->isSameDay($assignment->effective_from->copy()->subDay());
            if ($previous && $endedByThisOne) {
                $this->userShiftRepository->update($previous, ['effective_to' => null]);
            }
        });
    }
}
