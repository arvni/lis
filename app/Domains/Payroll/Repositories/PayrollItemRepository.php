<?php

declare(strict_types=1);

namespace App\Domains\Payroll\Repositories;

use App\Domains\Payroll\Models\PayrollItem;
use App\Domains\Shared\Traits\LogsUserActivity;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

class PayrollItemRepository
{
    use LogsUserActivity;

    private const SORTABLE = ['start_date', 'calculation', 'created_at'];

    /**
     * @param  array<string, mixed>  $queryData
     * @return LengthAwarePaginator<int, PayrollItem>
     */
    public function listItems(array $queryData): LengthAwarePaginator
    {
        $filters = $queryData['filters'] ?? [];
        $field = $queryData['sort']['field'] ?? 'start_date';

        return PayrollItem::query()
            ->with(['user:id,name', 'type:id,name,kind'])
            ->when(! empty($filters['user_id']), fn (Builder $query) => $query->where('user_id', $filters['user_id']))
            ->when(! empty($filters['calculation']), fn (Builder $query) => $query->where('calculation', $filters['calculation']))
            ->when(! empty($filters['payroll_item_type_id']), fn (Builder $query) => $query->where('payroll_item_type_id', $filters['payroll_item_type_id']))
            ->orderBy(
                in_array($field, self::SORTABLE, true) ? $field : 'start_date',
                ($queryData['sort']['sort'] ?? 'desc') === 'asc' ? 'asc' : 'desc'
            )
            ->paginate($queryData['pageSize'] ?? 10);
    }

    /**
     * One person's items that could touch a month. Instalments have no end date — they finish when
     * they run out — so the schedule, not this query, decides whether one still applies.
     *
     * @return Collection<int, PayrollItem>
     */
    public function forUserInMonth(int $userId, string $from, string $to): Collection
    {
        return PayrollItem::query()
            ->with('type:id,name,kind')
            ->where('user_id', $userId)
            ->where('start_date', '<=', $to)
            ->where(fn (Builder $query) => $query->whereNull('end_date')->orWhere('end_date', '>=', $from))
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();
    }

    public function loadRelations(PayrollItem $item): PayrollItem
    {
        return $item->load(['user:id,name', 'type:id,name,kind']);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): PayrollItem
    {
        $item = PayrollItem::query()->make($data);
        $item->save();
        $this->logCreated($item);

        return $item;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(PayrollItem $item, array $data): PayrollItem
    {
        $item->fill($data);
        if ($item->isDirty()) {
            $item->save();
            $this->logUpdated($item);
        }

        return $item;
    }

    public function delete(PayrollItem $item): void
    {
        $item->delete();
        $this->logDeleted($item);
    }
}
