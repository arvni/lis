<?php

declare(strict_types=1);

namespace App\Domains\Attendance\Repositories;

use App\Domains\Attendance\Models\UserShift;
use App\Domains\Shared\Traits\LogsUserActivity;
use Illuminate\Database\Eloquent\Collection;

class UserShiftRepository
{
    use LogsUserActivity;

    /**
     * @return Collection<int, UserShift> newest first
     */
    public function listForUser(int $userId): Collection
    {
        return UserShift::query()
            ->where('user_id', $userId)
            ->with('shift:id,name,is_active')
            ->orderByDesc('effective_from')
            ->get();
    }

    public function latestForUser(int $userId): ?UserShift
    {
        return UserShift::query()
            ->where('user_id', $userId)
            ->orderByDesc('effective_from')
            ->first();
    }

    public function previousFor(UserShift $assignment): ?UserShift
    {
        return UserShift::query()
            ->where('user_id', $assignment->user_id)
            ->where('effective_from', '<', $assignment->effective_from->toDateString())
            ->orderByDesc('effective_from')
            ->first();
    }

    public function existsForShift(int $shiftId): bool
    {
        return UserShift::query()->where('shift_id', $shiftId)->exists();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): UserShift
    {
        $assignment = UserShift::query()->make($data);
        $assignment->save();
        $this->logCreated($assignment);

        return $assignment->load('shift:id,name,is_active');
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(UserShift $assignment, array $data): UserShift
    {
        $assignment->fill($data);
        if ($assignment->isDirty()) {
            $assignment->save();
            $this->logUpdated($assignment);
        }

        return $assignment;
    }

    public function delete(UserShift $assignment): void
    {
        $assignment->delete();
        $this->logDeleted($assignment);
    }
}
