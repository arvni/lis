<?php

namespace App\Domains\Inventory\Repositories;

use App\Domains\Shared\Traits\LogsUserActivity;
use App\Domains\Inventory\Models\Item;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class ItemRepository
{
    use LogsUserActivity;

    /**
     * Active items for typeahead/scan lookup — matched by exact item code when a
     * barcode is given, otherwise by a search term. Returns a lightweight subset.
     *
     * @return Collection<int, Item>
     */
    public function lookupForScan(?string $barcode = null, ?string $search = null, int $limit = 20): Collection
    {
        $query = Item::with('defaultUnit')->active()->limit($limit);

        if ($barcode !== null && $barcode !== '') {
            $query->where('item_code', $barcode);
        } elseif ($search !== null && $search !== '') {
            $query->search($search);
        }

        return $query->get(['id', 'item_code', 'name', 'default_unit_id']);
    }

    public function listItems(array $queryData): LengthAwarePaginator
    {
        $query = Item::with('defaultUnit');
        if (isset($queryData['filters']['search']))
            $query->search($queryData['filters']['search']);
        if (isset($queryData['filters']['department']))
            $query->where('department', $queryData['filters']['department']);
        if (isset($queryData['filters']['material_type']))
            $query->where('material_type', $queryData['filters']['material_type']);
        if (isset($queryData['filters']['storage_condition']))
            $query->where('storage_condition', $queryData['filters']['storage_condition']);
        if (isset($queryData['filters']['is_active']))
            $query->where('is_active', $queryData['filters']['is_active']);
        if (isset($queryData['sort']))
            $query->orderBy($queryData['sort']['field'] ?? 'item_code', $queryData['sort']['sort'] ?? 'asc');
        return $query->paginate($queryData['pageSize'] ?? 20);
    }

    public function createItem(array $data): Item
    {
        $conversions = $data['unit_conversions'] ?? [];
        unset($data['unit_conversions']);
        $item = Item::query()->create($data);
        foreach ($conversions as $conv)
            $item->unitConversions()->create($conv);
        $this->logCreated($item);
        return $item;
    }

    public function updateItem(Item $item, array $data): Item
    {
        $conversions = $data['unit_conversions'] ?? null;
        unset($data['unit_conversions']);
        $item->fill($data);
        if ($item->isDirty())
            $item->save();
        if ($conversions !== null) {
            $item->unitConversions()->delete();
            foreach ($conversions as $conv)
                $item->unitConversions()->create($conv);
        }
        $this->logUpdated($item);
        return $item;
    }

    public function deleteItem(Item $item): void
    {
        $item->delete();
        $this->logDeleted($item);
    }
}
