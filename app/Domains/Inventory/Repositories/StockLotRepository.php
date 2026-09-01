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
     * Base query for dated lots still on the shelf — ordered by soonest expiry.
     */
    private function datedLotsOnHand(?int $storeId): Builder
    {
        return StockLot::with(['item', 'store', 'location'])
            ->onHand()
            ->where('quantity_base_units', '>', 0)
            ->whereNotNull('expiry_date')
            ->when($storeId, fn (Builder $q) => $q->where('store_id', $storeId))
            ->orderBy('expiry_date', 'asc');
    }

    /**
     * Lots on hand whose expiry date has already passed. Covers lots the nightly
     * sweep has flagged EXPIRED as well as ones it has not reached yet.
     */
    public function expired(?int $storeId = null): Collection
    {
        return $this->datedLotsOnHand($storeId)
            ->whereDate('expiry_date', '<', now())
            ->get();
    }

    /**
     * Usable lots expiring from today through the next $days days (inclusive).
     */
    public function expiringWithin(int $days, ?int $storeId = null): Collection
    {
        return $this->datedLotsOnHand($storeId)
            ->where('status', LotStatus::ACTIVE->value)
            ->whereDate('expiry_date', '>=', now())
            ->whereDate('expiry_date', '<=', now()->addDays($days))
            ->get();
    }

    /**
     * Lots for an item in a store in the order stock should be drawn from them.
     *
     * Usable lots go oldest-received first. When expired stock is allowed it is
     * offered up before anything usable — an operator who has ticked the expired
     * box means to burn that stock down, not to eat into good stock first.
     *
     * @return Collection<int, StockLot>
     */
    public function activeFifoLots(int $itemId, int $storeId, bool $includeExpired = false): Collection
    {
        if (! $includeExpired) {
            return StockLot::where('item_id', $itemId)
                ->where('store_id', $storeId)
                ->usable()
                ->where('quantity_base_units', '>', 0)
                ->orderBy('received_date')
                ->orderBy('id')
                ->get();
        }

        $expired = StockLot::where('item_id', $itemId)
            ->where('store_id', $storeId)
            ->expired()
            ->where('quantity_base_units', '>', 0)
            ->orderBy('expiry_date')
            ->orderBy('id')
            ->get();

        return $expired->concat($this->activeFifoLots($itemId, $storeId));
    }

    public function getTotalStockInStore(int $itemId, int $storeId, bool $includeExpired = false): string
    {
        return StockLot::where('item_id', $itemId)
            ->where('store_id', $storeId)
            ->when($includeExpired, fn (Builder $q) => $q->onHand(), fn (Builder $q) => $q->usable())
            ->sum('quantity_base_units');
    }

    /**
     * Usable base units an item holds, grouped by store.
     *
     * @return array<int, float> store id => quantity
     */
    public function activeTotalsByStore(int $itemId): array
    {
        return $this->totalsByStore($itemId, fn (Builder $q) => $q->usable());
    }

    /**
     * Base units an item physically holds — usable and expired — by store. This
     * is what the transaction ledger accounts for, so it is the figure stock
     * recalculation compares against.
     *
     * @return array<int, float> store id => quantity
     */
    public function onHandTotalsByStore(int $itemId): array
    {
        return $this->totalsByStore($itemId, fn (Builder $q) => $q->onHand());
    }

    /**
     * @param  \Closure(Builder<StockLot>): Builder<StockLot>  $scope
     * @return array<int, float> store id => quantity
     */
    private function totalsByStore(int $itemId, \Closure $scope): array
    {
        return $scope(StockLot::where('item_id', $itemId))
            ->groupBy('store_id')
            ->selectRaw('store_id, SUM(quantity_base_units) AS total')
            ->pluck('total', 'store_id')
            ->map(fn ($total) => (float) $total)
            ->all();
    }

    public function getLotsExpiringSoon(int $days = 30): Collection
    {
        return StockLot::with(['item', 'store'])
            ->expiringSoon($days)
            ->get();
    }

    /**
     * In-stock lots for an item — optionally filtered by store and a
     * lot-number/brand search term. Expired lots are left out unless asked for,
     * so they only reach a transaction line the operator has flagged. Returns a
     * lightweight column subset.
     *
     * @return Collection<int, StockLot>
     */
    public function activeLotsForItem(int $itemId, ?int $storeId = null, ?string $search = null, bool $includeExpired = false): Collection
    {
        return StockLot::where('item_id', $itemId)
            ->when($includeExpired, fn (Builder $q) => $q->onHand(), fn (Builder $q) => $q->usable())
            ->where('quantity_base_units', '>', 0)
            ->when($storeId, fn (Builder $q) => $q->where('store_id', $storeId))
            ->when($search, fn (Builder $q) => $q->where(function (Builder $q2) use ($search) {
                $q2->where('lot_number', 'like', "%{$search}%")
                    ->orWhere('brand', 'like', "%{$search}%");
            }))
            ->orderBy('received_date')
            ->get(['id', 'lot_number', 'brand', 'barcode', 'expiry_date', 'quantity_base_units', 'store_id', 'store_location_id', 'status']);
    }

    /**
     * In-stock lots carrying a scanned lot-level barcode — soonest received
     * first, with item/unit loaded. Expired lots are included so a scan of an
     * expired container still identifies what is in the operator's hand.
     *
     * @return Collection<int, StockLot>
     */
    public function activeLotsByBarcode(string $barcode): Collection
    {
        return StockLot::with(['item.defaultUnit', 'item.unitConversions.unit'])
            ->where('barcode', $barcode)
            ->onHand()
            ->where('quantity_base_units', '>', 0)
            ->orderBy('received_date')
            ->get();
    }

    /**
     * Lot on hand matching a scanned barcode, with item/unit/store/location loaded.
     */
    public function findActiveByBarcode(string $barcode): ?StockLot
    {
        return StockLot::with(['item.defaultUnit', 'store', 'location'])
            ->where('barcode', $barcode)
            ->onHand()
            ->first();
    }

    /**
     * Total usable base-unit quantity for an item, optionally scoped to a store.
     */
    public function totalActiveBaseUnits(int $itemId, ?int $storeId = null): float
    {
        return (float) StockLot::where('item_id', $itemId)
            ->usable()
            ->when($storeId, fn (Builder $q) => $q->where('store_id', $storeId))
            ->sum('quantity_base_units');
    }

    /**
     * Total expired base-unit quantity still on the shelf for an item.
     */
    public function totalExpiredBaseUnits(int $itemId, ?int $storeId = null): float
    {
        return (float) StockLot::where('item_id', $itemId)
            ->expired()
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
     * Release quarantined lots in a store that match the given lot numbers
     * (e.g. on transfer-receipt confirmation). A lot that arrives already past
     * its date is released as EXPIRED rather than becoming usable stock.
     * Returns the number of lots updated.
     *
     * @param  iterable<int, string>  $lotNumbers
     */
    public function activateQuarantinedLots(int $storeId, iterable $lotNumbers): int
    {
        $quarantined = fn () => StockLot::where('store_id', $storeId)
            ->where('status', LotStatus::QUARANTINE->value)
            ->whereIn('lot_number', $lotNumbers);

        $expired = $quarantined()
            ->whereNotNull('expiry_date')
            ->whereDate('expiry_date', '<', now())
            ->update(['status' => LotStatus::EXPIRED->value]);

        return $expired + $quarantined()->update(['status' => LotStatus::ACTIVE->value]);
    }

    public function markExpiredLots(): int
    {
        return StockLot::where('status', 'ACTIVE')
            ->whereNotNull('expiry_date')
            ->whereDate('expiry_date', '<', now())
            ->update(['status' => 'EXPIRED']);
    }
}
