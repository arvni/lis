<?php

declare(strict_types=1);

namespace App\Domains\Attendance\Repositories;

use App\Domains\Attendance\Models\LeaveKind;
use App\Domains\Attendance\Models\LeaveRequest;
use App\Domains\Shared\Traits\LogsUserActivity;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

class LeaveKindRepository
{
    use LogsUserActivity;

    private const SORTABLE = ['name', 'is_active', 'created_at'];

    /**
     * @param  array<string, mixed>  $queryData
     * @return LengthAwarePaginator<int, LeaveKind>
     */
    public function listKinds(array $queryData): LengthAwarePaginator
    {
        $filters = $queryData['filters'] ?? [];
        $field = $queryData['sort']['field'] ?? 'name';

        return LeaveKind::query()
            ->when(! empty($filters['search']), fn (Builder $query) => $query->search(['name'], $filters['search']))
            ->when(
                isset($filters['is_active']) && $filters['is_active'] !== '',
                fn (Builder $query) => $query->where('is_active', filter_var($filters['is_active'], FILTER_VALIDATE_BOOLEAN))
            )
            ->orderBy(
                in_array($field, self::SORTABLE, true) ? $field : 'name',
                ($queryData['sort']['sort'] ?? 'asc') === 'desc' && $field !== 'id' ? 'desc' : 'asc'
            )
            ->paginate($queryData['pageSize'] ?? 10);
    }

    /**
     * @return Collection<int, LeaveKind>
     */
    public function activeKinds(): Collection
    {
        return LeaveKind::query()->where('is_active', true)->orderBy('name')->get(['id', 'name']);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): LeaveKind
    {
        $kind = LeaveKind::query()->make($data);
        $kind->save();
        $this->logCreated($kind);

        return $kind;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(LeaveKind $kind, array $data): LeaveKind
    {
        $kind->fill($data);
        if ($kind->isDirty()) {
            $kind->save();
            $this->logUpdated($kind);
        }

        return $kind;
    }

    public function isInUse(LeaveKind $kind): bool
    {
        return LeaveRequest::query()->where('leave_kind_id', $kind->id)->exists();
    }

    public function delete(LeaveKind $kind): void
    {
        $kind->delete();
        $this->logDeleted($kind);
    }
}
