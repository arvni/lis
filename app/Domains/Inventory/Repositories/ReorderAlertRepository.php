<?php

namespace App\Domains\Inventory\Repositories;

use App\Domains\Inventory\Enums\ReorderAlertStatus;
use App\Domains\Inventory\Models\ReorderAlert;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ReorderAlertRepository
{
    public function listAlerts(array $queryData): LengthAwarePaginator
    {
        $query = ReorderAlert::with(['item.defaultUnit', 'store'])
            ->orderBy('created_at', 'desc');
        if (isset($queryData['filters']['status']))
            $query->where('status', $queryData['filters']['status']);
        if (isset($queryData['filters']['store_id']))
            $query->where('store_id', $queryData['filters']['store_id']);
        return $query->paginate($queryData['pageSize'] ?? 20);
    }

    public function upsertAlert(int $itemId, int $storeId, float $currentQty, float $minLevel): ReorderAlert
    {
        return ReorderAlert::updateOrCreate(
            ['item_id' => $itemId, 'store_id' => $storeId, 'status' => ReorderAlertStatus::OPEN->value],
            ['current_qty_base' => $currentQty, 'minimum_stock_level' => $minLevel]
        );
    }

    public function resolveAlert(ReorderAlert $alert): void
    {
        $alert->update([
            'status'      => ReorderAlertStatus::RESOLVED->value,
            'resolved_at' => now(),
        ]);
    }
}
