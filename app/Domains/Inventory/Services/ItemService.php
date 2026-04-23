<?php

namespace App\Domains\Inventory\Services;

use App\Domains\Inventory\Models\Item;
use App\Domains\Inventory\Repositories\ItemRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

readonly class ItemService
{
    public function __construct(
        private ItemRepository  $itemRepository,
        private ItemCodeService $itemCodeService,
    ) {}

    public function listItems(array $filters): LengthAwarePaginator
    {
        return $this->itemRepository->listItems($filters);
    }

    public function createItem(array $data): Item
    {
        return DB::transaction(function () use ($data) {
            $data['item_code'] = $this->itemCodeService->generate($data['department'], $data['material_type']);
            return $this->itemRepository->createItem($data);
        });
    }

    public function updateItem(Item $item, array $data): Item
    {
        return $this->itemRepository->updateItem($item, $data);
    }

    public function deleteItem(Item $item): void
    {
        $this->itemRepository->deleteItem($item);
    }

    public function getItemById(int $id): Item
    {
        return Item::with(['defaultUnit', 'unitConversions.unit', 'supplierItems.supplier'])->findOrFail($id);
    }
}
