<?php

namespace App\Domains\Inventory\Repositories;

use App\Domains\Shared\Traits\LogsUserActivity;
use App\Domains\Inventory\Models\Supplier;
use App\Domains\Inventory\Models\SupplierContact;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

class SupplierRepository
{
    use LogsUserActivity;

    /**
     * Active suppliers matching a name/code search term, limited for typeahead lookups.
     */
    public function searchActiveForLookup(string $search, int $limit = 20): Collection
    {
        return Supplier::active()
            ->where(function (Builder $q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%");
            })
            ->limit($limit)
            ->get(['id', 'name', 'code']);
    }

    public function listSuppliers(array $queryData): LengthAwarePaginator
    {
        $query = Supplier::withCount('contacts', 'supplierItems');
        if (isset($queryData['filters']['search']))
            $query->search($queryData['filters']['search']);
        if (isset($queryData['filters']['type']))
            $query->where('type', $queryData['filters']['type']);
        if (isset($queryData['filters']['is_active']))
            $query->where('is_active', $queryData['filters']['is_active']);
        if (isset($queryData['sort']))
            $query->orderBy($queryData['sort']['field'] ?? 'name', $queryData['sort']['sort'] ?? 'asc');
        return $query->paginate($queryData['pageSize'] ?? 15);
    }

    public function createSupplier(array $data): Supplier
    {
        $contacts = $data['contacts'] ?? [];
        unset($data['contacts']);
        $supplier = Supplier::query()->create($data);
        foreach ($contacts as $contact)
            $supplier->contacts()->create($contact);
        $this->logCreated($supplier);
        return $supplier;
    }

    public function updateSupplier(Supplier $supplier, array $data): Supplier
    {
        $contacts = $data['contacts'] ?? null;
        unset($data['contacts']);
        $supplier->fill($data);
        if ($supplier->isDirty())
            $supplier->save();
        if ($contacts !== null) {
            $supplier->contacts()->delete();
            foreach ($contacts as $contact)
                $supplier->contacts()->create($contact);
        }
        $this->logUpdated($supplier);
        return $supplier;
    }

    public function deleteSupplier(Supplier $supplier): void
    {
        $supplier->delete();
        $this->logDeleted($supplier);
    }
}
