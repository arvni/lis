<?php

namespace App\Domains\Inventory\Repositories;

use App\Domains\Inventory\Models\Store;
use App\Domains\Inventory\Models\StoreLocation;
use App\Domains\User\Enums\ActivityType;
use App\Domains\User\Services\UserActivityService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class StoreRepository
{
    public function listStores(array $queryData): LengthAwarePaginator
    {
        $query = Store::withCount('locations');
        if (isset($queryData['filters']['search']))
            $query->where(function ($q) use ($queryData) {
                $q->where('name', 'like', '%' . $queryData['filters']['search'] . '%')
                  ->orWhere('code', 'like', '%' . $queryData['filters']['search'] . '%');
            });
        if (isset($queryData['filters']['is_active']) && $queryData['filters']['is_active'] !== '')
            $query->where('is_active', (bool) $queryData['filters']['is_active']);
        if (isset($queryData['sort']))
            $query->orderBy($queryData['sort']['field'] ?? 'name', $queryData['sort']['sort'] ?? 'asc');
        return $query->paginate($queryData['pageSize'] ?? 15);
    }

    public function createStore(array $data): Store
    {
        $store = Store::query()->create($data);
        UserActivityService::createUserActivity($store, ActivityType::CREATE);
        return $store;
    }

    public function updateStore(Store $store, array $data): Store
    {
        $store->fill($data);
        if ($store->isDirty()) {
            $store->save();
            UserActivityService::createUserActivity($store, ActivityType::UPDATE);
        }
        return $store;
    }

    public function deleteStore(Store $store): void
    {
        $store->delete();
        UserActivityService::createUserActivity($store, ActivityType::DELETE);
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
