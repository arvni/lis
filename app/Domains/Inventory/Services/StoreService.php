<?php

namespace App\Domains\Inventory\Services;

use App\Domains\Inventory\Models\Store;
use App\Domains\Inventory\Repositories\StoreRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

readonly class StoreService
{
    public function __construct(
        private StoreRepository $storeRepository,
    ) {}

    public function listStores(array $filters): LengthAwarePaginator
    {
        return $this->storeRepository->listStores($filters);
    }

    public function createStore(array $data): Store
    {
        return $this->storeRepository->createStore($data);
    }

    public function updateStore(Store $store, array $data): Store
    {
        return $this->storeRepository->updateStore($store, $data);
    }

    public function deleteStore(Store $store): void
    {
        $this->storeRepository->deleteStore($store);
    }

    public function getStoreById(int $id): Store
    {
        return Store::with(['locations', 'manager'])->findOrFail($id);
    }

    public function addLocation(Store $store, array $data): \App\Domains\Inventory\Models\StoreLocation
    {
        return $this->storeRepository->createLocation($store, $data);
    }
}
