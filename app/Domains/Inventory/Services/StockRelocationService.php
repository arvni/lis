<?php

declare(strict_types=1);

namespace App\Domains\Inventory\Services;

use App\Domains\Inventory\DTOs\RelocateStockDTO;
use App\Domains\Inventory\Enums\LotStatus;
use App\Domains\Inventory\Models\StockLot;
use App\Domains\Inventory\Models\StockLotRelocation;
use App\Domains\Inventory\Repositories\StockLotRelocationRepository;
use App\Domains\Inventory\Repositories\StoreRepository;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * Moves stock that is already on hand to another place. Quantity never changes:
 * a relocation only rewrites where a lot — or part of one — is held, and leaves
 * an audit row behind. Moving the full quantity rewrites the lot in place;
 * moving part of it splits the remainder onto a second lot row.
 */
readonly class StockRelocationService
{
    /** Base-unit column is decimal(15,6), so compare at that precision. */
    private const PRECISION = 6;

    public function __construct(
        private StockLotRelocationRepository $relocationRepository,
        private StoreRepository $storeRepository,
        private ReorderAlertService $reorderAlertService,
    ) {}

    /**
     * @return StockLot the lot row holding the stock at its new place
     *
     * @throws RuntimeException when the move is not possible
     */
    public function relocate(StockLot $lot, RelocateStockDTO $data, int $userId): StockLot
    {
        $quantity = round($data->quantity_base_units, self::PRECISION);
        $onHand = round((float) $lot->quantity_base_units, self::PRECISION);

        $this->assertMovable($lot);
        $this->assertQuantity($quantity, $onHand);

        $destination = $this->resolveDestination($lot, $data);
        [$toStoreId, $toLocationId] = $destination;

        $fromStoreId = $lot->store_id;
        $fromLocationId = $lot->store_location_id;

        return DB::transaction(function () use (
            $lot, $quantity, $onHand, $toStoreId, $toLocationId,
            $fromStoreId, $fromLocationId, $userId, $data
        ) {
            $isFullMove = $this->isSameQuantity($quantity, $onHand);

            $destinationLot = $isFullMove
                ? $this->moveWholeLot($lot, $toStoreId, $toLocationId)
                : $this->splitLot($lot, $quantity, $toStoreId, $toLocationId);

            $this->relocationRepository->record([
                'stock_lot_id' => $lot->id,
                'destination_lot_id' => $destinationLot->id === $lot->id ? null : $destinationLot->id,
                'item_id' => $lot->item_id,
                'quantity_base_units' => $quantity,
                'from_store_id' => $fromStoreId,
                'from_store_location_id' => $fromLocationId,
                'to_store_id' => $toStoreId,
                'to_store_location_id' => $toLocationId,
                'user_id' => $userId,
                'notes' => $data->notes,
            ]);

            // A move between stores changes how much each store holds, so the
            // store losing stock may now sit under its reorder level.
            if ($fromStoreId !== $toStoreId) {
                $this->reorderAlertService->checkAndAlert($lot->item_id, $fromStoreId);
            }

            return $destinationLot;
        });
    }

    /**
     * @return Collection<int, StockLotRelocation>
     */
    public function historyForLot(StockLot $lot): Collection
    {
        return $this->relocationRepository->historyForLot($lot);
    }

    private function assertMovable(StockLot $lot): void
    {
        if ($lot->status !== LotStatus::ACTIVE) {
            throw new RuntimeException(
                "Only active stock can be relocated; lot {$lot->lot_number} is {$lot->status->value}."
            );
        }
    }

    private function assertQuantity(float $quantity, float $onHand): void
    {
        if ($quantity <= 0) {
            throw new RuntimeException('The quantity to relocate must be greater than zero.');
        }

        if ($quantity > $onHand && ! $this->isSameQuantity($quantity, $onHand)) {
            throw new RuntimeException(
                "Cannot relocate {$quantity} base units; the lot only holds {$onHand}."
            );
        }
    }

    /**
     * @return array{0: int, 1: int|null}
     */
    private function resolveDestination(StockLot $lot, RelocateStockDTO $data): array
    {
        $store = $this->storeRepository->findActiveStore($data->to_store_id);

        if (! $store) {
            throw new RuntimeException('The destination store does not exist or is not active.');
        }

        $locationId = null;

        if ($data->to_store_location_id !== null) {
            $location = $this->storeRepository->findActiveLocationInStore(
                $store->id,
                $data->to_store_location_id,
            );

            if (! $location) {
                throw new RuntimeException(
                    "The destination location does not belong to {$store->name}, or is not active."
                );
            }

            $locationId = $location->id;
        }

        if ($store->id === $lot->store_id && $locationId === $lot->store_location_id) {
            throw new RuntimeException('The stock is already in that place.');
        }

        return [$store->id, $locationId];
    }

    /**
     * The whole lot moves, so the row itself is rewritten and keeps its history.
     */
    private function moveWholeLot(StockLot $lot, int $toStoreId, ?int $toLocationId): StockLot
    {
        $lot->update([
            'store_id' => $toStoreId,
            'store_location_id' => $toLocationId,
        ]);

        return $lot;
    }

    /**
     * Part of the lot moves: the source keeps the remainder and the moved
     * quantity joins an equivalent lot row at the destination, or starts one.
     */
    private function splitLot(StockLot $lot, float $quantity, int $toStoreId, ?int $toLocationId): StockLot
    {
        $lot->decrement('quantity_base_units', $quantity);

        $target = $this->relocationRepository->findMergeTarget($lot, $toStoreId, $toLocationId);

        if ($target) {
            $target->increment('quantity_base_units', $quantity);

            return $target->refresh();
        }

        return StockLot::create([
            'item_id' => $lot->item_id,
            'lot_number' => $lot->lot_number,
            'brand' => $lot->brand,
            'barcode' => $lot->barcode,
            'expiry_date' => $lot->expiry_date,
            'manufacture_date' => $lot->manufacture_date,
            'received_date' => $lot->received_date,
            'quantity_base_units' => $quantity,
            'unit_price_base' => $lot->unit_price_base,
            'store_id' => $toStoreId,
            'store_location_id' => $toLocationId,
            'status' => LotStatus::ACTIVE->value,
        ]);
    }

    private function isSameQuantity(float $a, float $b): bool
    {
        return abs($a - $b) < 0.5 / (10 ** self::PRECISION);
    }
}
