<?php

namespace App\Http\Controllers\Inventory;

use App\Domains\Inventory\Models\StockLot;
use App\Domains\Inventory\Models\StockLotRelocation;
use App\Domains\Inventory\Models\StockTransaction;
use App\Domains\Inventory\Models\StockTransactionLine;
use App\Domains\Inventory\Repositories\StockTransactionRepository;
use App\Domains\Inventory\Repositories\StoreRepository;
use App\Domains\Inventory\Services\StockRelocationService;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StockLotController extends Controller
{
    public function __construct(
        private StockTransactionRepository $stockTransactions,
        private StockRelocationService $relocationService,
        private StoreRepository $stores,
    ) {}

    public function show(Request $request, StockLot $lot): Response
    {
        $this->authorize('viewAny', StockTransaction::class);

        $lot->load(['item.defaultUnit', 'store', 'location']);

        $lines = $this->stockTransactions
            ->approvedLinesForLot($lot->item_id, $lot->lot_number)
            ->map(function (StockTransactionLine $line) {
                $tx    = $line->transaction;
                $type  = $tx->transaction_type->value;
                $isOut = in_array($type, ['EXPORT', 'TRANSFER', 'EXPIRED_REMOVAL']);
                return [
                    'date'           => $tx->transaction_date->format('Y-m-d'),
                    'reference'      => $tx->reference_number,
                    'transaction_id' => $tx->id,
                    'type'           => $type,
                    'direction'      => $isOut ? 'OUT' : 'IN',
                    'store'          => $tx->store->name,
                    'location'       => $line->location?->label,
                    'quantity'       => (float) $line->quantity,
                    'unit'           => $line->unit?->name,
                    'base_units'     => (float) $line->quantity_base_units,
                ];
            });

        $relocations = $this->relocationService->historyForLot($lot)
            ->map(fn (StockLotRelocation $move) => [
                'id'         => $move->id,
                'date'       => $move->created_at?->format('Y-m-d H:i'),
                'quantity'   => (float) $move->quantity_base_units,
                'from'       => $this->placeLabel($move->fromStore?->name, $move->fromLocation?->label),
                'to'         => $this->placeLabel($move->toStore?->name, $move->toLocation?->label),
                'moved_by'   => $move->user?->name,
                'notes'      => $move->notes,
            ]);

        return Inertia::render('Inventory/Lots/Show', [
            'lot'         => $lot,
            'lines'       => $lines,
            'relocations' => $relocations,
            'stores'      => $this->stores->activeForSelect(),
            'canRelocate' => $request->user()?->can('approve', StockTransaction::class) ?? false,
        ]);
    }

    private function placeLabel(?string $store, ?string $location): string
    {
        return collect([$store, $location])->filter()->implode(' · ');
    }
}
