<?php

declare(strict_types=1);

namespace App\Domains\Attendance\Repositories;

use App\Domains\Attendance\Models\Holiday;
use App\Domains\Shared\Traits\LogsUserActivity;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;

class HolidayRepository
{
    use LogsUserActivity;

    private const SORTABLE = ['id', 'date', 'title'];

    /**
     * @param  array<string, mixed>  $queryData
     * @return LengthAwarePaginator<int, Holiday>
     */
    public function listHolidays(array $queryData): LengthAwarePaginator
    {
        $query = Holiday::query();

        if (isset($queryData['filters'])) {
            $this->applyFilters($query, $queryData['filters']);
        }

        // Newest dates first unless the grid asks otherwise; `id` is the grid's default sort field.
        $field = $queryData['sort']['field'] ?? 'date';
        $query->orderBy(
            in_array($field, self::SORTABLE, true) && $field !== 'id' ? $field : 'date',
            ($queryData['sort']['sort'] ?? 'desc') === 'asc' ? 'asc' : 'desc'
        );

        return $query->paginate($queryData['pageSize'] ?? 10);
    }

    /**
     * Holidays between the dates (Y-m-d, inclusive), keyed by Y-m-d.
     *
     * @return array<string, Holiday>
     */
    public function holidaysBetween(string $from, string $to): array
    {
        $holidays = [];
        foreach (Holiday::query()->whereBetween('date', [$from, $to])->get(['id', 'date', 'title']) as $holiday) {
            $holidays[$holiday->date->format('Y-m-d')] = $holiday;
        }

        return $holidays;
    }

    /**
     * Holiday dates between the dates (Y-m-d, inclusive).
     *
     * @return list<string> Y-m-d
     */
    public function datesBetween(string $from, string $to): array
    {
        return array_values(Holiday::query()
            ->whereBetween('date', [$from, $to])
            ->get(['date'])
            ->map(fn (Holiday $holiday) => $holiday->date->format('Y-m-d'))
            ->all());
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function createHoliday(array $data): Holiday
    {
        $holiday = Holiday::query()->make($data);
        $holiday->save();
        $this->logCreated($holiday);

        return $holiday;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function updateHoliday(Holiday $holiday, array $data): Holiday
    {
        $holiday->fill($data);
        if ($holiday->isDirty()) {
            $holiday->save();
            $this->logUpdated($holiday);
        }

        return $holiday;
    }

    public function deleteHoliday(Holiday $holiday): void
    {
        $holiday->delete();
        $this->logDeleted($holiday);
    }

    /**
     * @param  Builder<Holiday>  $query
     * @param  array<string, mixed>  $filters
     */
    protected function applyFilters(Builder $query, array $filters): void
    {
        if (! empty($filters['search'])) {
            $query->search(['title'], $filters['search']);
        }
        if (! empty($filters['from_date'])) {
            $query->whereDate('date', '>=', $filters['from_date']);
        }
        if (! empty($filters['to_date'])) {
            $query->whereDate('date', '<=', $filters['to_date']);
        }
    }
}
