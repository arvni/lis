<?php

declare(strict_types=1);

namespace App\Domains\Inventory\Services;

use App\Domains\Inventory\Enums\TransactionType;
use App\Domains\Inventory\Models\StockTransactionLine;
use App\Domains\Inventory\Repositories\StockLotRelocationRepository;
use App\Domains\Inventory\Repositories\StockTransactionRepository;

/**
 * Replays an item's approved transaction ledger to work out how much stock each
 * store *should* be holding, independently of what the stock_lots rows say.
 *
 * This deliberately mirrors StockMutationService: entries open lots, exports and
 * transfers consume them FIFO, and an adjustment sets a named lot to an absolute
 * quantity rather than nudging it. Only lots that would be ACTIVE are counted,
 * so stock sitting in quarantine awaiting a transfer receipt is excluded — that
 * matches what the Current Stock screens total up.
 *
 * Two documented approximations:
 *  - FIFO order is taken as ledger order (transaction date, then id). That is the
 *    order lots were created in, so it agrees with the real received_date sort
 *    except where a lot was booked in with a back-dated received date.
 *  - EXPIRED_REMOVAL zeroes lots whose expiry had passed on the transaction date,
 *    since that is what "status was EXPIRED at the time" meant.
 */
readonly class StockLedgerReplayService
{
    private const PRECISION = 6;

    public function __construct(
        private StockTransactionRepository $transactions,
        private StockLotRelocationRepository $relocations,
    ) {}

    /**
     * Expected ACTIVE base units per store for an item.
     *
     * @return array<int, float> store id => expected quantity
     */
    public function expectedByStore(int $itemId): array
    {
        $lots = [];

        foreach ($this->transactions->approvedLinesForItem($itemId) as $line) {
            $this->applyLine($lots, $line);
        }

        $expected = [];

        foreach ($lots as $lot) {
            if (! $lot['active'] || $lot['qty'] <= 0) {
                continue;
            }

            $expected[$lot['store']] = round(
                ($expected[$lot['store']] ?? 0.0) + $lot['qty'],
                self::PRECISION
            );
        }

        // Relocations move stock without writing a transaction. Within one store
        // they cancel out; across stores they shift the per-store totals, so fold
        // in the net movement rather than replaying them in sequence.
        foreach ($this->relocations->netMovementByStore($itemId) as $storeId => $net) {
            $expected[$storeId] = round(($expected[$storeId] ?? 0.0) + $net, self::PRECISION);
        }

        return array_map(fn (float $qty) => max(0.0, $qty), $expected);
    }

    /**
     * @param  array<int, array{store: int, lot: string, qty: float, expiry: string|null, active: bool}>  $lots
     */
    private function applyLine(array &$lots, StockTransactionLine $line): void
    {
        $tx = $line->transaction;
        $quantity = round((float) $line->quantity_base_units, self::PRECISION);

        match ($tx->transaction_type) {
            TransactionType::ENTRY, TransactionType::RETURN => $this->open($lots, $line),
            TransactionType::EXPORT => $this->consume($lots, $tx->store_id, $quantity),
            TransactionType::TRANSFER => $this->transfer($lots, $line, $quantity),
            TransactionType::ADJUST => $this->adjust($lots, $line, $quantity),
            TransactionType::EXPIRED_REMOVAL => $this->removeExpired($lots, $tx->store_id, $tx->transaction_date->toDateString()),
        };
    }

    /** @param array<int, array{store: int, lot: string, qty: float, expiry: string|null, active: bool}> $lots */
    private function open(array &$lots, StockTransactionLine $line): void
    {
        $tx = $line->transaction;

        $lots[] = [
            'store' => $tx->store_id,
            'lot' => $line->lot_number ?? 'LOT-'.$tx->transaction_date->format('Ymd').'-'.$line->id,
            'qty' => round((float) $line->quantity_base_units, self::PRECISION),
            'expiry' => $line->expiry_date?->toDateString(),
            'active' => true,
        ];
    }

    /**
     * Draw down a store's lots oldest-first, returning what each lot gave up.
     *
     * @param  array<int, array{store: int, lot: string, qty: float, expiry: string|null, active: bool}>  $lots
     * @return array<int, array{lot: string, expiry: string|null, qty: float}>
     */
    private function consume(array &$lots, int $storeId, float $quantity): array
    {
        $taken = [];
        $remaining = $quantity;

        foreach ($lots as &$lot) {
            if ($remaining <= 0) {
                break;
            }

            if ($lot['store'] !== $storeId || ! $lot['active'] || $lot['qty'] <= 0) {
                continue;
            }

            $take = min($lot['qty'], $remaining);
            $lot['qty'] = round($lot['qty'] - $take, self::PRECISION);
            $remaining = round($remaining - $take, self::PRECISION);

            $taken[] = ['lot' => $lot['lot'], 'expiry' => $lot['expiry'], 'qty' => $take];
        }

        return $taken;
    }

    /** @param array<int, array{store: int, lot: string, qty: float, expiry: string|null, active: bool}> $lots */
    private function transfer(array &$lots, StockTransactionLine $line, float $quantity): void
    {
        $tx = $line->transaction;
        $moved = $this->consume($lots, $tx->store_id, $quantity);

        if (! $tx->destination_store_id) {
            return;
        }

        // Transferred stock lands in quarantine and only counts once the
        // receiving store confirms it.
        $isActive = $tx->transfer_received_at !== null;

        foreach ($moved as $chunk) {
            $lots[] = [
                'store' => $tx->destination_store_id,
                'lot' => $chunk['lot'],
                'qty' => $chunk['qty'],
                'expiry' => $chunk['expiry'],
                'active' => $isActive,
            ];
        }
    }

    /** @param array<int, array{store: int, lot: string, qty: float, expiry: string|null, active: bool}> $lots */
    private function adjust(array &$lots, StockTransactionLine $line, float $quantity): void
    {
        if (! $line->lot_number) {
            return;
        }

        foreach ($lots as &$lot) {
            if ($lot['store'] === $line->transaction->store_id
                && $lot['lot'] === $line->lot_number
                && $lot['active']
            ) {
                $lot['qty'] = max(0.0, $quantity);

                return;
            }
        }
    }

    /** @param array<int, array{store: int, lot: string, qty: float, expiry: string|null, active: bool}> $lots */
    private function removeExpired(array &$lots, int $storeId, string $onDate): void
    {
        foreach ($lots as &$lot) {
            if ($lot['store'] === $storeId
                && $lot['expiry'] !== null
                && $lot['expiry'] < $onDate
            ) {
                $lot['qty'] = 0.0;
            }
        }
    }
}
