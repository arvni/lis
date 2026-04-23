<?php

namespace App\Domains\Inventory\Services;

use App\Domains\Inventory\Enums\LotStatus;
use App\Domains\Inventory\Enums\TransactionType;
use App\Domains\Inventory\Models\StockLot;
use App\Domains\Inventory\Models\StockTransaction;
use App\Domains\Inventory\Repositories\StockLotRepository;
use Illuminate\Support\Facades\DB;
use RuntimeException;

readonly class StockMutationService
{
    public function __construct(
        private StockLotRepository    $lotRepository,
        private ReorderAlertService   $reorderAlertService,
    ) {}

    /**
     * Validate stock availability for all outbound lines without mutating anything.
     * Returns an array of shortage descriptions, empty if everything is available.
     */
    public function validateStock(StockTransaction $tx): array
    {
        $outbound = [
            TransactionType::EXPORT,
            TransactionType::TRANSFER,
            TransactionType::EXPIRED_REMOVAL,
        ];

        if (!in_array($tx->transaction_type, $outbound)) {
            return [];
        }

        $tx->loadMissing('lines.item');
        $shortages = [];

        foreach ($tx->lines as $line) {
            $needed    = (float) $line->quantity_base_units;
            $available = (float) $this->lotRepository->getTotalStockInStore($line->item_id, $tx->store_id);

            if ($available < $needed) {
                $itemName  = $line->item->name ?? "Item #{$line->item_id}";
                $shortages[] = "• {$itemName}: needed {$needed}, available {$available}";
            }
        }

        return $shortages;
    }

    /**
     * Apply approved transaction to stock. Wrapped in DB::transaction by caller.
     */
    public function apply(StockTransaction $tx): void
    {
        match ($tx->transaction_type) {
            TransactionType::ENTRY           => $this->applyEntry($tx),
            TransactionType::EXPORT          => $this->applyExport($tx),
            TransactionType::ADJUST          => $this->applyAdjust($tx),
            TransactionType::TRANSFER        => $this->applyTransfer($tx),
            TransactionType::RETURN          => $this->applyEntry($tx), // Return treated as entry
            TransactionType::EXPIRED_REMOVAL => $this->applyExpiredRemoval($tx),
        };
    }

    private function generateBarcode($line, int $txId): string
    {
        $itemCode = $line->item->item_code ?? "ITEM{$line->item_id}";
        $suffix   = $line->brand
            ? preg_replace('/\s+/', '-', strtoupper(trim($line->brand)))
            : $txId;
        return "{$itemCode}-{$suffix}";
    }

    private function applyEntry(StockTransaction $tx): void
    {
        $totalValue = 0;

        foreach ($tx->lines as $line) {
            $unitPriceBase = $line->unit_price
                ? (float) $line->unit_price / (float) $line->quantity * (float) $line->quantity_base_units
                : 0;

            $barcode = $line->barcode ?: $this->generateBarcode($line, $tx->id);

            StockLot::create([
                'item_id'             => $line->item_id,
                'lot_number'          => $line->lot_number ?? 'LOT-' . now()->format('Ymd') . '-' . $line->id,
                'brand'               => $line->brand,
                'barcode'             => $barcode,
                'expiry_date'         => $line->expiry_date,
                'received_date'       => $tx->transaction_date,
                'quantity_base_units' => $line->quantity_base_units,
                'unit_price_base'     => $unitPriceBase,
                'store_id'            => $tx->store_id,
                'store_location_id'   => $line->store_location_id,
                'status'              => LotStatus::ACTIVE->value,
            ]);

            $totalValue += (float) ($line->total_price ?? 0);
        }

        $tx->update(['total_value' => $totalValue]);
    }

    private function applyExport(StockTransaction $tx): void
    {
        $totalValue = 0;

        foreach ($tx->lines as $line) {
            $needed = (float) $line->quantity_base_units;
            $lots   = $this->lotRepository->activeFifoLots($line->item_id, $tx->store_id);
            $available = $lots->sum('quantity_base_units');

            if ($available < $needed)
                throw new RuntimeException("Insufficient stock for item ID {$line->item_id}. Available: {$available}, Needed: {$needed}");

            $costTotal = 0;
            foreach ($lots as $lot) {
                if ($needed <= 0) break;
                $take = min((float) $lot->quantity_base_units, $needed);
                $costTotal += $take * (float) $lot->unit_price_base;
                $lot->decrement('quantity_base_units', $take);
                if ((float) $lot->fresh()->quantity_base_units <= 0)
                    $lot->update(['status' => LotStatus::CONSUMED->value]);
                $needed -= $take;
            }

            $line->update(['total_price' => $costTotal]);
            $totalValue += $costTotal;

            // Check reorder level
            $this->reorderAlertService->checkAndAlert($line->item_id, $tx->store_id);
        }

        $tx->update(['total_value' => $totalValue]);
    }

    private function applyAdjust(StockTransaction $tx): void
    {
        foreach ($tx->lines as $line) {
            if ($line->lot_number) {
                $lot = StockLot::where('item_id', $line->item_id)
                    ->where('lot_number', $line->lot_number)
                    ->where('store_id', $tx->store_id)
                    ->first();
                if ($lot) {
                    $lot->update(['quantity_base_units' => max(0, (float) $line->quantity_base_units)]);
                    if ((float) $lot->fresh()->quantity_base_units <= 0)
                        $lot->update(['status' => LotStatus::CONSUMED->value]);
                }
            }
            $this->reorderAlertService->checkAndAlert($line->item_id, $tx->store_id);
        }
    }

    private function applyTransfer(StockTransaction $tx): void
    {
        foreach ($tx->lines as $line) {
            $needed = (float) $line->quantity_base_units;
            $lots   = $this->lotRepository->activeFifoLots($line->item_id, $tx->store_id);
            $available = $lots->sum('quantity_base_units');

            if ($available < $needed)
                throw new RuntimeException("Insufficient stock for transfer of item ID {$line->item_id}");

            foreach ($lots as $lot) {
                if ($needed <= 0) break;
                $take = min((float) $lot->quantity_base_units, $needed);
                $lot->decrement('quantity_base_units', $take);
                if ((float) $lot->fresh()->quantity_base_units <= 0)
                    $lot->update(['status' => LotStatus::CONSUMED->value]);

                // Create corresponding lot in destination store as QUARANTINE until receipt confirmed
                StockLot::create([
                    'item_id'             => $lot->item_id,
                    'lot_number'          => $lot->lot_number,
                    'brand'               => $lot->brand,
                    'barcode'             => null,
                    'expiry_date'         => $lot->expiry_date,
                    'received_date'       => $tx->transaction_date,
                    'quantity_base_units' => $take,
                    'unit_price_base'     => $lot->unit_price_base,
                    'store_id'            => $tx->destination_store_id,
                    'store_location_id'   => $line->store_location_id,
                    'status'              => LotStatus::QUARANTINE->value,
                ]);

                $needed -= $take;
            }

            $this->reorderAlertService->checkAndAlert($line->item_id, $tx->store_id);
        }
    }

    private function applyExpiredRemoval(StockTransaction $tx): void
    {
        foreach ($tx->lines as $line) {
            StockLot::where('item_id', $line->item_id)
                ->where('store_id', $tx->store_id)
                ->where('status', LotStatus::EXPIRED->value)
                ->update(['quantity_base_units' => 0, 'status' => LotStatus::CONSUMED->value]);
        }
    }
}
