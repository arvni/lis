<?php

namespace App\Domains\Inventory\Services;

use App\Domains\Inventory\Models\Item;
use App\Domains\Inventory\Models\StockLot;
use App\Domains\Inventory\Models\StockTransactionLine;

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
            ->whereHas('transaction', fn($q) => $q->where('status', 'APPROVED'))
            ->orderBy('created_at', 'asc');

        if ($storeId)
            $lineQuery->whereHas('transaction', fn($q) => $q->where('store_id', $storeId));

        $lines     = $lineQuery->get();
        $runningBal = 0;
        $entries   = [];

        foreach ($lines as $line) {
            $tx   = $line->transaction;
            $type = $tx->transaction_type->value;
            $isOut = in_array($type, ['EXPORT', 'TRANSFER', 'EXPIRED_REMOVAL']);
            $delta = $isOut ? -(float) $line->quantity_base_units : (float) $line->quantity_base_units;
            $runningBal += $delta;

            $entries[] = [
                'date'           => $tx->transaction_date->format('Y-m-d'),
                'reference'      => $tx->reference_number,
                'transaction_id' => $tx->id,
                'type'           => $type,
                'store'          => $tx->store->name,
                'location'       => $line->location?->label,
                'lot_number'     => $line->lot_number,
                'brand'          => $line->brand,
                'quantity'       => $line->quantity,
                'unit'           => $line->unit->name,
                'base_units'     => abs($delta),
                'direction'      => $isOut ? 'OUT' : 'IN',
                'balance_base'   => $runningBal,
                'balance_fmt'    => $this->conversionService->formatStock($itemId, max(0, $runningBal)),
            ];
        }

        $activeLots = StockLot::where('item_id', $itemId)
            ->when($storeId, fn($q) => $q->where('store_id', $storeId))
            ->where('status', 'ACTIVE')
            ->with('store', 'location')
            ->get();

        return [
            'item'     => $item,
            'entries'  => $entries,
            'lots'     => $activeLots,
            'total_base' => $activeLots->sum('quantity_base_units'),
            'total_fmt'  => $this->conversionService->formatStock($itemId, (float) $activeLots->sum('quantity_base_units')),
        ];
    }

    public function getCurrentStock(?int $storeId = null, array $filters = []): \Illuminate\Support\Collection
    {
        $query = Item::with(['defaultUnit', 'unitConversions'])
            ->active()
            ->withSum(['lots' => fn($q) => $q->where('status', 'ACTIVE')
                ->when($storeId, fn($q2) => $q2->where('store_id', $storeId))
            ], 'quantity_base_units');

        if (!empty($filters['search']))
            $query->where(function ($q) use ($filters) {
                $q->where('name', 'like', '%' . $filters['search'] . '%')
                  ->orWhere('item_code', 'like', '%' . $filters['search'] . '%');
            });
        if (!empty($filters['department']))
            $query->where('department', $filters['department']);
        if (!empty($filters['material_type']))
            $query->where('material_type', $filters['material_type']);

        return $query->get()->map(function (Item $item) {
            $total = (float) ($item->lots_sum_quantity_base_units ?? 0);
            return [
                'item'         => $item,
                'total_base'   => $total,
                'is_low_stock' => $item->minimum_stock_level > 0 && $total < (float) $item->minimum_stock_level,
            ];
        })->when(!empty($filters['low_stock_only']), fn($c) => $c->filter(fn($r) => $r['is_low_stock'])->values());
    }
}
