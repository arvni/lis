<?php

declare(strict_types=1);

namespace App\Domains\Attendance\Repositories;

use App\Domains\Attendance\Models\Shift;
use App\Domains\Shared\Traits\LogsUserActivity;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

class ShiftRepository
{
    use LogsUserActivity;

    private const SORTABLE = ['id', 'name', 'is_active', 'created_at'];

    /**
     * @param  array<string, mixed>  $queryData
     * @return LengthAwarePaginator<int, Shift>
     */
    public function listShifts(array $queryData): LengthAwarePaginator
    {
        $query = Shift::query()->with('days');

        if (isset($queryData['filters'])) {
            $this->applyFilters($query, $queryData['filters']);
        }

        $field = $queryData['sort']['field'] ?? 'id';
        $query->orderBy(
            in_array($field, self::SORTABLE, true) ? $field : 'id',
            ($queryData['sort']['sort'] ?? 'desc') === 'asc' ? 'asc' : 'desc'
        );

        return $query->paginate($queryData['pageSize'] ?? 10);
    }

    /**
     * Active shifts as id/name pairs for pickers, optionally narrowed by name.
     *
     * @return Collection<int, Shift>
     */
    public function getActiveForSelect(?string $search): Collection
    {
        return Shift::query()
            ->where('is_active', true)
            ->when($search !== null, fn (Builder $query) => $query->search(['name'], $search))
            ->orderBy('name')
            ->limit(50)
            ->get(['id', 'name']);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function createShift(array $data): Shift
    {
        $shift = Shift::query()->make($data);
        $shift->save();
        $this->logCreated($shift);

        return $shift;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function updateShift(Shift $shift, array $data): Shift
    {
        $shift->fill($data);
        if ($shift->isDirty()) {
            $shift->save();
            $this->logUpdated($shift);
        }

        return $shift;
    }

    /**
     * Replace the shift's weekly hours with the given working days.
     *
     * @param  list<array{weekday: int, start_time: string, end_time: string}>  $days
     */
    public function replaceDays(Shift $shift, array $days): void
    {
        $shift->days()->delete();
        $shift->days()->createMany($days);
        $shift->unsetRelation('days');
    }

    public function deleteShift(Shift $shift): void
    {
        $shift->delete();
        $this->logDeleted($shift);
    }

    /**
     * @param  Builder<Shift>  $query
     * @param  array<string, mixed>  $filters
     */
    protected function applyFilters(Builder $query, array $filters): void
    {
        if (! empty($filters['search'])) {
            $query->search(['name'], $filters['search']);
        }
        if (isset($filters['is_active']) && $filters['is_active'] !== '') {
            $query->where('is_active', filter_var($filters['is_active'], FILTER_VALIDATE_BOOLEAN));
        }
    }
}
