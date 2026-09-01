<?php

namespace App\Domains\Inventory\Services;

use App\Domains\Inventory\Models\Item;
use App\Domains\Inventory\Models\StockLot;
use App\Domains\Inventory\Models\StockTransactionLine;
use Illuminate\Support\Collection;

readonly class StockCardService
{
    public function __construct(
        private UnitConversionService $conversionService,
    ) {}

    public function getStockCard(int $itemId, ?int $storeId = null): array
    {
        $item = Item::with(['defaultUnit', 'unitConversions.unit'])->findOrFail($itemId);

        $lineQuery = StockTransactionLine::with(['transaction.store', 'unit', 'location'])
            ->where('item_id', $itemId)
            ->whereHas('transaction', fn ($q) => $q->where('status', 'APPROVED'))
            ->orderBy('created_at', 'asc');

        if ($storeId) {
            $lineQuery->whereHas('transaction', fn ($q) => $q->where('store_id', $storeId));
        }

        $lines = $lineQuery->get();
        $runningBal = 0;
        $entries = [];

        foreach ($lines as $line) {
            $tx = $line->transaction;
            $type = $tx->transaction_type->value;
            $isOut = in_array($type, ['EXPORT', 'TRANSFER', 'EXPIRED_REMOVAL']);
            $delta = $isOut ? -(float) $line->quantity_base_units : (float) $line->quantity_base_units;
            $runningBal += $delta;

            $entries[] = [
                'date' => $tx->transaction_date->format('Y-m-d'),
                'reference' => $tx->reference_number,
                'transaction_id' => $tx->id,
                'type' => $type,
                'store' => $tx->store->name,
                'location' => $line->location?->label,
                'lot_number' => $line->lot_number,
                'brand' => $line->brand,
                'quantity' => $line->quantity,
                'unit' => $line->unit->name,
                'base_units' => abs($delta),
                'direction' => $isOut ? 'OUT' : 'IN',
                'balance_base' => $runningBal,
                'balance_fmt' => $this->conversionService->formatStock($itemId, max(0, $runningBal)),
            ];
        }

        // Expired lots are still on the shelf, so they belong on the card — but
        // they are totalled separately from the stock that can actually be used.
        $lots = StockLot::where('item_id', $itemId)
            ->when($storeId, fn ($q) => $q->where('store_id', $storeId))
            ->onHand()
            ->with('store', 'location')
            ->get();

        [$expiredLots, $usableLots] = $lots->partition(fn (StockLot $lot) => $lot->isExpired());

        $usableBase = (float) $usableLots->sum('quantity_base_units');
        $expiredBase = (float) $expiredLots->sum('quantity_base_units');

        return [
            'item' => $item,
            'entries' => $entries,
            'lots' => $lots,
            'total_base' => $usableBase,
            'total_fmt' => $this->conversionService->formatStock($itemId, $usableBase),
            'expired_base' => $expiredBase,
            'expired_fmt' => $expiredBase > 0
                ? $this->conversionService->formatStock($itemId, $expiredBase)
                : null,
        ];
    }

    public function getCurrentStock(?int $storeId = null, array $filters = []): Collection
    {
        $locationId = ! empty($filters['location_id']) ? (int) $filters['location_id'] : null;

        // Stock on the shelf, split into what can be used and what has expired.
        // Expired lots stay visible here — they still occupy space and can be
        // exported or written off — but they never count towards the usable
        // total, so a low-stock alert is not silenced by dead stock.
        $scoped = fn ($q) => $q
            ->when($storeId, fn ($q2) => $q2->where('store_id', $storeId))
            ->when($locationId, fn ($q2) => $q2->where('store_location_id', $locationId));

        $lotFilter = fn ($q) => $scoped($q)->usable();
        $expiredFilter = fn ($q) => $scoped($q)->expired();
        $onHandFilter = fn ($q) => $scoped($q)->onHand();

        $query = Item::with(['defaultUnit', 'unitConversions'])
            ->active()
            ->withSum(['lots as usable_base_units' => $lotFilter], 'quantity_base_units')
            ->withSum(['lots as expired_base_units' => $expiredFilter], 'quantity_base_units');

        if ($locationId) {
            $query->whereHas('lots', $onHandFilter);
        }

        if (! empty($filters['search'])) {
            $term = '%'.$filters['search'].'%';

            // Users search by whatever is on the container in front of them:
            // item name/code, the lot number, or the supplier catalog number —
            // which is recorded both when the item is ordered and when it is
            // booked in. Lot matches respect the store/location scope so a lot
            // held elsewhere does not surface here.
            $query->where(function ($q) use ($term, $onHandFilter) {
                $q->where('name', 'like', $term)
                    ->orWhere('item_code', 'like', $term)
                    ->orWhereHas('lots', fn ($q2) => $onHandFilter($q2)->where('lot_number', 'like', $term))
                    ->orWhereHas('transactionLines', fn ($q2) => $q2->where('cat_no', 'like', $term))
                    ->orWhereHas('purchaseRequestLines', fn ($q2) => $q2->where('cat_no', 'like', $term));
            });
        }
        if (! empty($filters['department'])) {
            $query->where('department', $filters['department']);
        }
        if (! empty($filters['material_type'])) {
            $query->where('material_type', $filters['material_type']);
        }

        return $query->get()->map(function (Item $item) {
            $total = (float) ($item->usable_base_units ?? 0);
            $expired = (float) ($item->expired_base_units ?? 0);

            return [
                'item' => $item,
                'total_base' => $total,
                'expired_base' => $expired,
                'has_expired' => $expired > 0,
                'is_low_stock' => $item->minimum_stock_level > 0 && $total < (float) $item->minimum_stock_level,
            ];
        })
            ->when(! empty($filters['low_stock_only']), fn ($c) => $c->filter(fn ($r) => $r['is_low_stock'])->values())
            ->when(! empty($filters['expired_only']), fn ($c) => $c->filter(fn ($r) => $r['has_expired'])->values());
    }
}
