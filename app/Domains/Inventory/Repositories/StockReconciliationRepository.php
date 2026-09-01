<?php

declare(strict_types=1);

namespace App\Domains\Inventory\Repositories;

use App\Domains\Inventory\Models\StockReconciliation;
use Illuminate\Database\Eloquent\Collection;

class StockReconciliationRepository
{
    public function record(array $data): StockReconciliation
    {
        return StockReconciliation::create($data);
    }

    /**
     * Corrections applied to an item, newest first.
     *
     * @return Collection<int, StockReconciliation>
     */
    public function historyForItem(int $itemId): Collection
    {
        return StockReconciliation::with(['store', 'user'])
            ->where('item_id', $itemId)
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->get();
    }
}
