<?php

namespace App\Domains\Inventory\Services;

use App\Domains\Inventory\Models\Item;
use App\Domains\Inventory\Models\Store;
use App\Domains\Inventory\Models\StockLot;
use App\Domains\Inventory\Notifications\ReorderAlertNotification;
use App\Domains\Inventory\Repositories\ReorderAlertRepository;
use App\Domains\User\Models\User;
use Illuminate\Support\Facades\Notification;

readonly class ReorderAlertService
{
    public function __construct(
        private ReorderAlertRepository $alertRepository,
    ) {}

    public function checkAndAlert(int $itemId, int $storeId): void
    {
        $item = Item::find($itemId);
        if (!$item || $item->minimum_stock_level <= 0) return;

        $currentQty = (float) StockLot::where('item_id', $itemId)
            ->where('store_id', $storeId)
            ->where('status', 'ACTIVE')
            ->sum('quantity_base_units');

        if ($currentQty < (float) $item->minimum_stock_level) {
            $alert = $this->alertRepository->upsertAlert($itemId, $storeId, $currentQty, (float) $item->minimum_stock_level);

            // Only notify on fresh alerts (wasRecentlyCreated avoids spam on every export)
            if ($alert->wasRecentlyCreated) {
                $store     = Store::find($storeId);
                $recipients = User::permission('Inventory.ReorderAlerts.View Reorder Alerts')->get();
                Notification::send($recipients, new ReorderAlertNotification($item, $store, $currentQty, (float) $item->minimum_stock_level));
            }
        }
    }
}
