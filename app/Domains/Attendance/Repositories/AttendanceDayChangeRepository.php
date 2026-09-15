<?php

declare(strict_types=1);

namespace App\Domains\Attendance\Repositories;

use App\Domains\Attendance\Models\AttendanceDayChange;

class AttendanceDayChangeRepository
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function record(array $data): AttendanceDayChange
    {
        return AttendanceDayChange::query()->create($data);
    }

    /**
     * One person's changes between the dates, newest first, keyed by Y-m-d.
     *
     * @return array<string, list<AttendanceDayChange>>
     */
    public function forUserBetween(int $userId, string $from, string $to): array
    {
        $changes = AttendanceDayChange::query()
            ->with('changedBy:id,name')
            ->where('user_id', $userId)
            ->whereBetween('date', [$from, $to])
            ->orderByDesc('id')
            ->get();

        $byDate = [];
        foreach ($changes as $change) {
            $byDate[$change->date->format('Y-m-d')][] = $change;
        }

        return $byDate;
    }
}
