<?php

declare(strict_types=1);

namespace App\Domains\Attendance\Repositories;

use App\Domains\Attendance\Models\AttendanceTransaction;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;

class AttendanceTransactionRepository
{
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
            ->orderBy('access_date_and_time', $direction)
            ->orderBy('id', $direction)
            ->paginate($queryData['pageSize'] ?? 10);
    }
}
