<?php

namespace App\Http\Controllers\Inventory;

use App\Domains\Inventory\Models\StockLot;
use App\Domains\Inventory\Models\StockTransaction;
use App\Domains\Inventory\Models\StockTransactionLine;
use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class StockLotController extends Controller
{
    public function show(StockLot $lot): Response
    {
        $this->authorize('viewAny', StockTransaction::class);

        $lot->load(['item.defaultUnit', 'store', 'location']);

        // All transaction lines that reference this lot_number for this item
        $lines = StockTransactionLine::with(['transaction.store', 'unit', 'location'])
            ->where('item_id', $lot->item_id)
            ->where('lot_number', $lot->lot_number)
            ->whereHas('transaction', fn($q) => $q->where('status', 'APPROVED'))
            ->orderBy('created_at', 'asc')
            ->get()
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

        return Inertia::render('Inventory/Lots/Show', [
            'lot'   => $lot,
            'lines' => $lines,
        ]);
    }
}
