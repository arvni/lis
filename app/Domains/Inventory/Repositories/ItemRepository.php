<?php

namespace App\Domains\Inventory\Repositories;

use App\Domains\Shared\Traits\LogsUserActivity;
use App\Domains\Inventory\Models\Item;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ItemRepository
{
    use LogsUserActivity;

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
