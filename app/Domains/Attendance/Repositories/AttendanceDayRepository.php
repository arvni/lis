<?php

declare(strict_types=1);

namespace App\Domains\Attendance\Repositories;

use App\Domains\Attendance\Models\AttendanceDay;
use App\Domains\Shared\Traits\LogsUserActivity;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

class AttendanceDayRepository
{
    use LogsUserActivity;

    private const SORTABLE = ['date', 'status', 'late_minutes', 'early_leave_minutes', 'worked_minutes'];

    /** Columns the scheduled job may overwrite on an automatic day. */
    private const CALCULATED_COLUMNS = [
        'shift_id',
        'scheduled_start',
        'scheduled_end',
        'check_in',
        'check_out',
        'status',
        'late_minutes',
        'early_leave_minutes',
        'worked_minutes',
        'leave_minutes',
        'is_manual',
        'note',
        'corrected_by',
        'corrected_at',
    ];

    /**
     * @param  array<string, mixed>  $queryData
     * @return LengthAwarePaginator<int, AttendanceDay>
     */
    public function listDays(array $queryData): LengthAwarePaginator
    {
        $field = $queryData['sort']['field'] ?? 'date';
        $direction = ($queryData['sort']['sort'] ?? 'desc') === 'asc' ? 'asc' : 'desc';

        return $this->filtered($queryData['filters'] ?? [])
            ->orderBy(in_array($field, self::SORTABLE, true) ? $field : 'date', $direction)
            ->orderBy('user_id')
            ->paginate($queryData['pageSize'] ?? 10);
    }

    /**
     * Every day matching the filters, oldest first, for export.
     *
     * @param  array<string, mixed>  $queryData
     * @return Collection<int, AttendanceDay>
     */
    public function allDays(array $queryData): Collection
    {
        return $this->filtered($queryData['filters'] ?? [])
            ->orderBy('date')
            ->orderBy('user_id')
            ->get();
    }

    /**
     * The days already stored in the range, keyed "userId|Y-m-d".
     *
     * @param  list<int>|null  $userIds
     * @return array<string, array{id: int, is_manual: bool}>
     */
    public function existingKeys(string $from, string $to, ?array $userIds): array
    {
        $days = AttendanceDay::query()
            ->whereBetween('date', [$from, $to])
            ->when($userIds !== null, fn (Builder $query) => $query->whereIn('user_id', $userIds))
            ->get(['id', 'user_id', 'date', 'is_manual']);

        $keys = [];
        foreach ($days as $day) {
            $keys[$day->user_id.'|'.$day->date->format('Y-m-d')] = ['id' => $day->id, 'is_manual' => $day->is_manual];
        }

        return $keys;
    }

    /**
     * Insert or overwrite calculated days, matched on user and date.
     *
     * @param  list<array<string, mixed>>  $rows
     */
    public function upsertCalculated(array $rows): void
    {
        foreach (array_chunk($rows, 500) as $chunk) {
            AttendanceDay::query()->upsert($chunk, ['user_id', 'date'], self::CALCULATED_COLUMNS);
        }
    }

    /**
     * Remove calculated days that no longer apply. Days corrected by hand are never removed here.
     *
     * @param  list<int>  $ids
     */
    public function deleteCalculated(array $ids): void
    {
        if ($ids === []) {
            return;
        }

        AttendanceDay::query()->whereIn('id', $ids)->where('is_manual', false)->delete();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(AttendanceDay $day, array $data): AttendanceDay
    {
        $day->fill($data);
        if ($day->isDirty()) {
            $day->save();
            $this->logUpdated($day);
        }

        return $day;
    }

    /**
     * Filters: `user` ({id}), `status`, `from_date`/`to_date` (Y-m-d) and `corrected` (hand-corrected days only).
     *
     * @param  array<string, mixed>  $filters
     * @return Builder<AttendanceDay>
     */
    private function filtered(array $filters): Builder
    {
        return AttendanceDay::query()
            ->with(['user:id,name', 'shift:id,name', 'correctedBy:id,name'])
            ->when(! empty($filters['user']['id']), fn (Builder $query) => $query->where('user_id', (int) $filters['user']['id']))
            ->when(! empty($filters['status']), fn (Builder $query) => $query->where('status', $filters['status']))
            ->when(! empty($filters['from_date']), fn (Builder $query) => $query->where('date', '>=', $filters['from_date']))
            ->when(! empty($filters['to_date']), fn (Builder $query) => $query->where('date', '<=', $filters['to_date']))
            ->when(
                filter_var($filters['corrected'] ?? false, FILTER_VALIDATE_BOOLEAN),
                fn (Builder $query) => $query->where('is_manual', true)
            );
    }
}
