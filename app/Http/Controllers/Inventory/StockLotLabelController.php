<?php

namespace App\Http\Controllers\Inventory;

use App\Domains\Inventory\Models\StockLot;
use App\Domains\Inventory\Models\StockTransaction;
use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class StockLotLabelController extends Controller
{
    /**
     * Print labels for all lots created by a specific ENTRY/RETURN transaction.
     */
    public function byTransaction(StockTransaction $transaction): Response
    {
        $this->authorize('viewAny', StockTransaction::class);

        $lots = StockLot::where('store_id', $transaction->store_id)
            ->where('received_date', $transaction->transaction_date)
            ->whereIn('lot_number', function ($q) use ($transaction) {
                $q->select('lot_number')
                  ->from('stock_transaction_lines')
                  ->where('transaction_id', $transaction->id)
                  ->whereNotNull('lot_number');
            })
            ->with(['item', 'store', 'location'])
            ->get();

        return Inertia::render('Inventory/Lots/Labels', [
            'lots'      => $lots,
            'reference' => $transaction->reference_number,
        ]);
    }

    /**
     * Print label for a single lot.
     */
    public function single(StockLot $lot): Response
    {
        $this->authorize('viewAny', StockTransaction::class);

        $lot->load(['item', 'store', 'location']);

        return Inertia::render('Inventory/Lots/Labels', [
            'lots'      => [$lot],
            'reference' => $lot->lot_number,
        ]);
    }
}
