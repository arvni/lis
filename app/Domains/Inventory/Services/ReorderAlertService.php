<?php

namespace App\Domains\Inventory\Services;

use App\Domains\Inventory\Models\Item;
use App\Domains\Inventory\Models\StockLot;
use App\Domains\Inventory\Repositories\ReorderAlertRepository;

readonly class ReorderAlertService
{
    public function __construct(
        private ReorderAlertRepository $alertRepository,
    ) {}

    public function checkAndAlert(int $itemId, int $storeId): void
    {
        $item = Item::find($itemId);
        if (!$item || $item->minimum_stock_level <= 0) return;

        $currentQty = StockLot::where('item_id', $itemId)
            ->where('store_id', $storeId)
            ->where('status', 'ACTIVE')
            ->sum('quantity_base_units');

        if ((float) $currentQty < (float) $item->minimum_stock_level) {
            $this->alertRepository->upsertAlert($itemId, $storeId, (float) $currentQty, (float) $item->minimum_stock_level);
        }
    }
}
