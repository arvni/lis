<?php

declare(strict_types=1);

namespace App\Domains\Attendance\Repositories;

use App\Domains\Attendance\Models\AttendanceTransaction;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class AttendanceTransactionRepository
{
    /**
     * Punches from the start of one day to the end of another, oldest first.
     *
     * @param  list<string>|null  $attendanceIds  only these Employee IDs (null = all)
     * @return Collection<int, AttendanceTransaction>
     */
    public function punchesBetween(Carbon $from, Carbon $to, ?array $attendanceIds): Collection
    {
        return AttendanceTransaction::query()
            ->when($attendanceIds !== null, fn (Builder $query) => $query->whereIn('attendance_id', $attendanceIds))
            ->whereBetween('access_date_and_time', [$from->format('Y-m-d 00:00:00'), $to->format('Y-m-d 23:59:59')])
            ->orderBy('access_date_and_time')
            ->get(['attendance_id', 'access_date_and_time']);
    }

    /**
     * @param  array<string, mixed>  $queryData
     * @param  list<string>|null  $onlyAttendanceIds  restrict to these Employee IDs (null = no restriction)
     * @param  list<string>|null  $exceptAttendanceIds  leave these Employee IDs out (null = none)
     * @return LengthAwarePaginator<int, AttendanceTransaction>
     */
    public function listTransactions(array $queryData, ?array $onlyAttendanceIds, ?array $exceptAttendanceIds): LengthAwarePaginator
    {
        $filters = $queryData['filters'] ?? [];
        $direction = ($queryData['sort']['sort'] ?? 'desc') === 'asc' ? 'asc' : 'desc';

        return AttendanceTransaction::query()
            ->when($onlyAttendanceIds !== null, fn (Builder $query) => $query->whereIn('attendance_id', $onlyAttendanceIds))
            ->when($exceptAttendanceIds !== null, fn (Builder $query) => $query->whereNotIn('attendance_id', $exceptAttendanceIds))
            ->when(! empty($filters['attendance_id']), fn (Builder $query) => $query->where('attendance_id', $filters['attendance_id']))
            ->when(! empty($filters['from_date']), fn (Builder $query) => $query->where('access_date_and_time', '>=', $filters['from_date'].' 00:00:00'))
            ->when(! empty($filters['to_date']), fn (Builder $query) => $query->where('access_date_and_time', '<=', $filters['to_date'].' 23:59:59'))
            ->with('importer:id,name')
            ->orderBy('access_date_and_time', $direction)
            ->orderBy('id', $direction)
            ->paginate($queryData['pageSize'] ?? 10);
    }

    /**
     * @param  list<array<string, mixed>>  $rows  column => value
     */
    public function insertMany(array $rows): void
    {
        DB::transaction(function () use ($rows) {
            foreach (array_chunk($rows, 500) as $chunk) {
                AttendanceTransaction::query()->insert($chunk);
            }
        });
    }
}
