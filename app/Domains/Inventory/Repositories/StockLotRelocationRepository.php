<?php

declare(strict_types=1);

namespace App\Domains\Inventory\Repositories;

use App\Domains\Inventory\Enums\LotStatus;
use App\Domains\Inventory\Models\StockLot;
use App\Domains\Inventory\Models\StockLotRelocation;
use Illuminate\Database\Eloquent\Collection;

class StockLotRelocationRepository
{
    public function record(array $data): StockLotRelocation
    {
        return StockLotRelocation::create($data);
    }

    /**
     * Relocation history for a lot number within one item — a partial move
     * splits the stock across lot rows, so history is tracked per lot number
     * rather than per row.
     *
     * @return Collection<int, StockLotRelocation>
     */
    public function historyForLot(StockLot $lot): Collection
    {
        return StockLotRelocation::with(['user', 'fromStore', 'toStore', 'fromLocation', 'toLocation'])
            ->where('item_id', $lot->item_id)
            ->whereHas('lot', fn ($q) => $q->where('lot_number', $lot->lot_number))
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->get();
    }

    /**
     * Net base units a relocation added to or removed from each store for an
     * item. Moves inside one store cancel out and drop away.
     *
     * @return array<int, float> store id => net quantity
     */
    public function netMovementByStore(int $itemId): array
    {
        $net = [];

        $rows = StockLotRelocation::where('item_id', $itemId)
            ->get(['from_store_id', 'to_store_id', 'quantity_base_units']);

        foreach ($rows as $row) {
            if ($row->from_store_id === $row->to_store_id) {
                continue;
            }

            $quantity = (float) $row->quantity_base_units;
            $net[$row->from_store_id] = ($net[$row->from_store_id] ?? 0.0) - $quantity;
            $net[$row->to_store_id] = ($net[$row->to_store_id] ?? 0.0) + $quantity;
        }

        return $net;
    }

    /**
     * An in-stock lot row at the destination that the moved quantity can be
     * folded into, so repeated moves do not fragment one lot across many rows.
     */
    public function findMergeTarget(StockLot $lot, int $toStoreId, ?int $toLocationId): ?StockLot
    {
        return StockLot::where('item_id', $lot->item_id)
            ->where('lot_number', $lot->lot_number)
            ->where('store_id', $toStoreId)
            ->where('store_location_id', $toLocationId)
            ->where('status', LotStatus::ACTIVE->value)
            ->where('received_date', $lot->received_date)
            ->where('unit_price_base', $lot->unit_price_base)
            ->whereKeyNot($lot->id)
            ->first();
    }
}
