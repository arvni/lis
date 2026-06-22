<?php

namespace App\Domains\Inventory\Repositories;

use App\Domains\Inventory\Models\SupplierItem;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

class SupplierItemRepository
{
    /**
     * Recorded purchase prices for an item across all (or one) suppliers,
     * highest first, with the supplier eager-loaded. Only rows that carry a
     * last purchase price are returned.
     *
     * @return Collection<int, SupplierItem>
     */
    public function purchasePricesForItem(int $itemId, ?int $supplierId = null): Collection
    {
        return SupplierItem::with('supplier')
            ->where('item_id', $itemId)
            ->when($supplierId, fn (Builder $q) => $q->where('supplier_id', $supplierId))
            ->whereNotNull('last_purchase_price')
            ->orderByDesc('last_purchase_price')
            ->get(['id', 'supplier_id', 'last_purchase_price', 'currency', 'unit_id', 'is_preferred']);
    }
}
