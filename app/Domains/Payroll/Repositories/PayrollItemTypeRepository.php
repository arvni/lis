<?php

declare(strict_types=1);

namespace App\Domains\Payroll\Repositories;

use App\Domains\Payroll\Models\PayrollItem;
use App\Domains\Payroll\Models\PayrollItemType;
use App\Domains\Shared\Traits\LogsUserActivity;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

class PayrollItemTypeRepository
{
    use LogsUserActivity;

    private const SORTABLE = ['name', 'kind', 'default_amount', 'is_active', 'created_at'];

    /**
     * @param  array<string, mixed>  $queryData
     * @return LengthAwarePaginator<int, PayrollItemType>
     */
    public function listTypes(array $queryData): LengthAwarePaginator
    {
        $filters = $queryData['filters'] ?? [];
        $field = $queryData['sort']['field'] ?? 'name';

        return PayrollItemType::query()
            ->when(! empty($filters['search']), fn (Builder $query) => $query->search(['name'], $filters['search']))
            ->when(! empty($filters['kind']), fn (Builder $query) => $query->where('kind', $filters['kind']))
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
     * The items a contract can still be given, for the picker.
     *
     * @return Collection<int, PayrollItemType>
     */
    public function activeTypes(): Collection
    {
        return PayrollItemType::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'kind', 'default_amount']);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): PayrollItemType
    {
        $type = PayrollItemType::query()->make($data);
        $type->save();
        $this->logCreated($type);

        return $type;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(PayrollItemType $type, array $data): PayrollItemType
    {
        $type->fill($data);
        if ($type->isDirty()) {
            $type->save();
            $this->logUpdated($type);
        }

        return $type;
    }

    public function isInUse(PayrollItemType $type): bool
    {
        // Anyone's item counts, including a loan that is already paid off: deleting the type would
        // leave a past slip unable to say what the deduction was for.
        return PayrollItem::query()->where('payroll_item_type_id', $type->id)->exists();
    }

    public function delete(PayrollItemType $type): void
    {
        $type->delete();
        $this->logDeleted($type);
    }
}
