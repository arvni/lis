<?php

declare(strict_types=1);

namespace App\Domains\Inventory\Services;

use App\Domains\Inventory\DTOs\StockReconciliationLineDTO;
use App\Domains\Inventory\Enums\LotStatus;
use App\Domains\Inventory\Models\Item;
use App\Domains\Inventory\Models\StockLot;
use App\Domains\Inventory\Repositories\StockLotRepository;
use App\Domains\Inventory\Repositories\StockReconciliationRepository;
use App\Domains\Inventory\Repositories\StoreRepository;
use Illuminate\Support\Facades\DB;

/**
 * Re-derives an item's on-hand stock from its approved transaction ledger and
 * writes the lots back into agreement with it.
 *
 * Corrections are made against real lots — surplus is drawn down oldest-first,
 * and a shortfall is added to the newest lot on hand so the stock keeps a
 * plausible expiry and cost. Only when a store holds no lot at all is one
 * opened to carry the balance. Every store that moves gets an audit row.
 */
readonly class StockReconciliationService
{
    /** Below this the two figures are the same number in decimal(15,6). */
    private const EPSILON = 0.0000005;

    public function __construct(
        private StockLedgerReplayService $replay,
        private StockLotRepository $lots,
        private StockReconciliationRepository $reconciliations,
        private StoreRepository $stores,
        private ReorderAlertService $reorderAlerts,
    ) {}

    /**
     * @return array<int, StockReconciliationLineDTO> one entry per store examined
     */
    public function recalculate(Item $item, int $userId, ?int $storeId = null): array
    {
        $expected = $this->replay->expectedByStore($item->id);

        // The ledger does not know about expiry — it only knows stock came in
        // and has not gone out again — so the figure it is compared against has
        // to count expired lots as still on hand. Otherwise every expired lot
        // would read as a shortfall and be silently replaced.
        $actual = $this->lots->onHandTotalsByStore($item->id);

        $storeIds = array_unique(array_merge(array_keys($expected), array_keys($actual)));
        sort($storeIds);

        if ($storeId !== null) {
            $storeIds = array_values(array_filter($storeIds, fn (int $id) => $id === $storeId));
        }

        $results = [];

        foreach ($storeIds as $id) {
            $results[] = DB::transaction(
                fn () => $this->reconcileStore($item, $id, $expected[$id] ?? 0.0, $actual[$id] ?? 0.0, $userId)
            );
        }

        return $results;
    }

    private function reconcileStore(Item $item, int $storeId, float $expected, float $previous, int $userId): StockReconciliationLineDTO
    {
        $difference = round($expected - $previous, 6);
        $store = $this->stores->findActiveStore($storeId);
        $storeName = $store === null ? "Store #{$storeId}" : $store->name;

        if (abs($difference) < self::EPSILON) {
            return new StockReconciliationLineDTO($storeId, $storeName, $previous, $expected, 0.0, false);
        }

        $difference > 0
            ? $this->addStock($item, $storeId, $difference)
            : $this->drawDown($item, $storeId, abs($difference));

        $this->reconciliations->record([
            'item_id' => $item->id,
            'store_id' => $storeId,
            'previous_base_units' => $previous,
            'expected_base_units' => $expected,
            'difference_base_units' => $difference,
            'user_id' => $userId,
            'notes' => 'Recalculated from the approved transaction ledger.',
        ]);

        // The corrected level may cross the item's reorder threshold.
        $this->reorderAlerts->checkAndAlert($item->id, $storeId);

        return new StockReconciliationLineDTO($storeId, $storeName, $previous, $expected, $difference, true);
    }

    /**
     * Surplus on the shelves that the ledger does not account for: take it off
     * the expired lots first and then the oldest usable ones, mirroring how an
     * export would have consumed it.
     */
    private function drawDown(Item $item, int $storeId, float $quantity): void
    {
        $remaining = $quantity;

        foreach ($this->lots->activeFifoLots($item->id, $storeId, includeExpired: true) as $lot) {
            if ($remaining <= 0) {
                break;
            }

            $take = min((float) $lot->quantity_base_units, $remaining);
            $lot->decrement('quantity_base_units', $take);
            $remaining = round($remaining - $take, 6);

            if ((float) $lot->fresh()->quantity_base_units <= 0) {
                $lot->update(['status' => LotStatus::CONSUMED->value]);
            }
        }
    }

    /**
     * The ledger accounts for more than the lots hold. Put it on the newest lot
     * so it inherits a sensible expiry and unit cost, or open one if the store
     * has nothing to attach it to.
     */
    private function addStock(Item $item, int $storeId, float $quantity): void
    {
        $newest = $this->lots->activeFifoLots($item->id, $storeId)->last();

        if ($newest) {
            $newest->increment('quantity_base_units', $quantity);

            return;
        }

        StockLot::create([
            'item_id' => $item->id,
            'lot_number' => 'RECON-'.now()->format('Ymd-His'),
            'received_date' => now()->toDateString(),
            'quantity_base_units' => $quantity,
            'unit_price_base' => 0,
            'store_id' => $storeId,
            'status' => LotStatus::ACTIVE->value,
        ]);
    }
}
