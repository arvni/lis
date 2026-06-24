<?php

namespace App\Domains\Inventory\Repositories;

use App\Domains\Inventory\Enums\LotStatus;
use App\Domains\Inventory\Models\StockLot;
use App\Domains\Inventory\Models\StockTransaction;
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
     *
     * @return Collection<int, StockLot>
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

    /**
     * Active, in-stock lots for an item — optionally filtered by store and a
     * lot-number/brand search term. Returns a lightweight column subset.
     *
     * @return Collection<int, StockLot>
     */
    public function activeLotsForItem(int $itemId, ?int $storeId = null, ?string $search = null): Collection
    {
        return StockLot::where('item_id', $itemId)
            ->where('status', LotStatus::ACTIVE->value)
            ->where('quantity_base_units', '>', 0)
            ->when($storeId, fn (Builder $q) => $q->where('store_id', $storeId))
            ->when($search, fn (Builder $q) => $q->where(function (Builder $q2) use ($search) {
                $q2->where('lot_number', 'like', "%{$search}%")
                    ->orWhere('brand', 'like', "%{$search}%");
            }))
            ->orderBy('received_date')
            ->get(['id', 'lot_number', 'brand', 'barcode', 'expiry_date', 'quantity_base_units', 'store_id', 'store_location_id']);
    }

    /**
     * Active, in-stock lots carrying a scanned lot-level barcode — soonest
     * received first, with item/unit loaded.
     *
     * @return Collection<int, StockLot>
     */
    public function activeLotsByBarcode(string $barcode): Collection
    {
        return StockLot::with(['item.defaultUnit', 'item.unitConversions.unit'])
            ->where('barcode', $barcode)
            ->where('status', LotStatus::ACTIVE->value)
            ->where('quantity_base_units', '>', 0)
            ->orderBy('received_date')
            ->get();
    }

    /**
     * Active lot matching a scanned barcode, with item/unit/store/location loaded.
     */
    public function findActiveByBarcode(string $barcode): ?StockLot
    {
        return StockLot::with(['item.defaultUnit', 'store', 'location'])
            ->where('barcode', $barcode)
            ->where('status', LotStatus::ACTIVE->value)
            ->first();
    }

    /**
     * Total active base-unit quantity for an item, optionally scoped to a store.
     */
    public function totalActiveBaseUnits(int $itemId, ?int $storeId = null): float
    {
        return (float) StockLot::where('item_id', $itemId)
            ->where('status', LotStatus::ACTIVE->value)
            ->when($storeId, fn (Builder $q) => $q->where('store_id', $storeId))
            ->sum('quantity_base_units');
    }

    /**
     * Lots created by an ENTRY/RETURN transaction — matched by store, received
     * date, and the lot numbers recorded on that transaction's lines.
     *
     * @return Collection<int, StockLot>
     */
    public function lotsCreatedByTransaction(StockTransaction $transaction): Collection
    {
        return StockLot::where('store_id', $transaction->store_id)
            ->where('received_date', $transaction->transaction_date)
            ->whereIn('lot_number', function ($q) use ($transaction) {
                $q->select('lot_number')
                    ->from('stock_transaction_lines')
                    ->where('transaction_id', $transaction->id)
                    ->whereNotNull('lot_number');
            })
            ->with(['item', 'store', 'location'])
            ->get();
    }

    /**
     * Activate quarantined lots in a store that match the given lot numbers
     * (e.g. on transfer-receipt confirmation). Returns the number of lots updated.
     *
     * @param  iterable<int, string>  $lotNumbers
     */
    public function activateQuarantinedLots(int $storeId, iterable $lotNumbers): int
    {
        return StockLot::where('store_id', $storeId)
            ->where('status', LotStatus::QUARANTINE->value)
            ->whereIn('lot_number', $lotNumbers)
            ->update(['status' => LotStatus::ACTIVE->value]);
    }

    public function markExpiredLots(): int
    {
        return StockLot::where('status', 'ACTIVE')
            ->whereNotNull('expiry_date')
            ->whereDate('expiry_date', '<', now())
            ->update(['status' => 'EXPIRED']);
    }
}
