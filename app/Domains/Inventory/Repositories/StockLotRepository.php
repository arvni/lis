<?php

namespace App\Domains\Inventory\Repositories;

use App\Domains\Inventory\Enums\LotStatus;
use App\Domains\Inventory\Models\StockLot;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

class StockLotRepository
{
    /**
     * Base query for active, in-stock, dated lots — ordered by soonest expiry.
     */
    private function datedActiveLots(?int $storeId): Builder
    {
        return StockLot::with(['item', 'store', 'location'])
            ->where('status', LotStatus::ACTIVE->value)
            ->where('quantity_base_units', '>', 0)
            ->whereNotNull('expiry_date')
            ->when($storeId, fn (Builder $q) => $q->where('store_id', $storeId))
            ->orderBy('expiry_date', 'asc');
    }

    /**
     * Active lots whose expiry date has already passed.
     */
    public function expired(?int $storeId = null): Collection
    {
        return $this->datedActiveLots($storeId)
            ->whereDate('expiry_date', '<', now())
            ->get();
    }

    /**
     * Active lots expiring from today through the next $days days (inclusive).
     */
    public function expiringWithin(int $days, ?int $storeId = null): Collection
    {
        return $this->datedActiveLots($storeId)
            ->whereDate('expiry_date', '>=', now())
            ->whereDate('expiry_date', '<=', now()->addDays($days))
            ->get();
    }

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
