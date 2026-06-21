<?php

namespace App\Domains\Inventory\Repositories;

use App\Domains\Inventory\Models\Store;
use App\Domains\Inventory\Models\StoreLocation;
use App\Domains\Shared\Traits\LogsUserActivity;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

class StoreRepository
{
    use LogsUserActivity;

    /**
     * Active stores as lightweight {id, name} options for selects.
     */
    public function activeForSelect(): Collection
    {
        return Store::active()->get(['id', 'name']);
    }

    /**
     * Active locations in a store for transaction lookups. For outbound
     * transaction types, only locations currently holding the given item with
     * available stock are returned; otherwise all active locations.
     *
     * @return Collection<int, StoreLocation>
     */
    public function locationsForLookup(Store $store, ?int $itemId, ?string $type): Collection
    {
        $query = StoreLocation::where('store_id', $store->id)->active();

        if ($itemId && $type) {
            $isOutbound = in_array($type, ['EXPORT', 'RETURN', 'EXPIRED_REMOVAL', 'TRANSFER']);

            if ($isOutbound) {
                $query->whereHas('lots', fn (Builder $q) => $q
                    ->where('item_id', $itemId)
                    ->where('status', 'ACTIVE')
                    ->where('quantity_base_units', '>', 0)
                );
            }
        }

        return $query->get(['id', 'label', 'zone', 'row', 'shelf', 'bin']);
    }

    public function listStores(array $queryData): LengthAwarePaginator
    {
        $query = Store::withCount('locations');
        if (isset($queryData['filters']['search'])) {
            $query->where(function ($q) use ($queryData) {
                $q->where('name', 'like', '%'.$queryData['filters']['search'].'%')
                    ->orWhere('code', 'like', '%'.$queryData['filters']['search'].'%');
            });
        }
        if (isset($queryData['filters']['is_active']) && $queryData['filters']['is_active'] !== '') {
            $query->where('is_active', (bool) $queryData['filters']['is_active']);
        }
        if (isset($queryData['sort'])) {
            $query->orderBy($queryData['sort']['field'] ?? 'name', $queryData['sort']['sort'] ?? 'asc');
        }

        return $query->paginate($queryData['pageSize'] ?? 15);
    }

    public function createStore(array $data): Store
    {
        $store = Store::query()->create($data);
        $this->logCreated($store);

        return $store;
    }

    public function updateStore(Store $store, array $data): Store
    {
        $store->fill($data);
        if ($store->isDirty()) {
            $store->save();
            $this->logUpdated($store);
        }

        return $store;
    }

    public function deleteStore(Store $store): void
    {
        $store->delete();
        $this->logDeleted($store);
    }

    public function createLocation(Store $store, array $data): StoreLocation
    {
        $data['label'] = StoreLocation::generateLabel(
            $data['zone'] ?? null, $data['row'] ?? null,
            $data['column'] ?? null, $data['shelf'] ?? null, $data['bin'] ?? null
        );

        return $store->locations()->create($data);
    }
}
