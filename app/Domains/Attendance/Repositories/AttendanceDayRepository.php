<?php

declare(strict_types=1);

namespace App\Domains\Attendance\Repositories;

use App\Domains\Attendance\Enums\AttendanceStatus;
use App\Domains\Attendance\Models\AttendanceDay;
use App\Domains\Shared\Traits\LogsUserActivity;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

class AttendanceDayRepository
{
    use LogsUserActivity;

    private const SORTABLE = ['date', 'status', 'late_minutes', 'early_leave_minutes', 'worked_minutes', 'overtime_minutes'];

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
        'overtime_minutes',
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

    public function findById(int $id): ?AttendanceDay
    {
        return AttendanceDay::query()->find($id);
    }

    /**
     * Each person's month in numbers: minutes summed and days counted by status.
     *
     * @return array<int, array{worked_minutes: int, overtime_minutes: int, late_minutes: int, early_leave_minutes: int, leave_minutes: int, present_days: int, absent_days: int, leave_days: int, corrected_days: int}>
     */
    public function totalsByUserBetween(string $from, string $to): array
    {
        $rows = AttendanceDay::query()
            ->whereBetween('date', [$from, $to])
            ->groupBy('user_id')
            ->select('user_id')
            ->selectRaw('SUM(worked_minutes) AS worked_minutes')
            ->selectRaw('SUM(overtime_minutes) AS overtime_minutes')
            ->selectRaw('SUM(late_minutes) AS late_minutes')
            ->selectRaw('SUM(early_leave_minutes) AS early_leave_minutes')
            ->selectRaw('SUM(leave_minutes) AS leave_minutes')
            ->selectRaw('SUM(CASE WHEN status IN (?, ?) THEN 1 ELSE 0 END) AS present_days', [
                AttendanceStatus::PRESENT->value,
                AttendanceStatus::INCOMPLETE->value,
            ])
            ->selectRaw('SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) AS absent_days', [AttendanceStatus::ABSENT->value])
            ->selectRaw('SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) AS leave_days', [AttendanceStatus::LEAVE->value])
            ->selectRaw('SUM(CASE WHEN is_manual = 1 THEN 1 ELSE 0 END) AS corrected_days')
            ->toBase()
            ->get();

        $totals = [];
        foreach ($rows as $row) {
            $totals[(int) $row->user_id] = [
                'worked_minutes' => (int) $row->worked_minutes,
                'overtime_minutes' => (int) $row->overtime_minutes,
                'late_minutes' => (int) $row->late_minutes,
                'early_leave_minutes' => (int) $row->early_leave_minutes,
                'leave_minutes' => (int) $row->leave_minutes,
                'present_days' => (int) $row->present_days,
                'absent_days' => (int) $row->absent_days,
                'leave_days' => (int) $row->leave_days,
                'corrected_days' => (int) $row->corrected_days,
            ];
        }

        return $totals;
    }

    /**
     * One person's stored days between the dates, keyed by Y-m-d.
     *
     * @return array<string, AttendanceDay>
     */
    public function forUserBetween(int $userId, string $from, string $to): array
    {
        $days = [];
        $query = AttendanceDay::query()->where('user_id', $userId)->whereBetween('date', [$from, $to]);
        foreach ($query->get() as $day) {
            $days[$day->date->format('Y-m-d')] = $day;
        }

        return $days;
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
