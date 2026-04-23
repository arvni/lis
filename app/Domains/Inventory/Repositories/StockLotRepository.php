<?php

namespace App\Domains\Inventory\Repositories;

use App\Domains\Inventory\Models\StockLot;
use Illuminate\Database\Eloquent\Collection;

class StockLotRepository
{
    /**
     * Returns active lots for an item in a store ordered FIFO (oldest first).
     */
    public function activeFifoLots(int $itemId, int $storeId): Collection
    {
        return StockLot::where('item_id', $itemId)
            ->where('store_id', $storeId)
            ->activeFifo()
            ->get();
    }

    public function getTotalStockInStore(int $itemId, int $storeId): string
    {
        return StockLot::where('item_id', $itemId)
            ->where('store_id', $storeId)
            ->where('status', 'ACTIVE')
            ->sum('quantity_base_units');
    }

    public function getLotsExpiringSoon(int $days = 30): Collection
    {
        return StockLot::with(['item', 'store'])
            ->expiringSoon($days)
            ->get();
    }

    public function markExpiredLots(): int
    {
        return StockLot::where('status', 'ACTIVE')
            ->whereNotNull('expiry_date')
            ->whereDate('expiry_date', '<', now())
            ->update(['status' => 'EXPIRED']);
    }
}
