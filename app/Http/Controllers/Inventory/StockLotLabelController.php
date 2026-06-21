<?php

namespace App\Http\Controllers\Inventory;

use App\Domains\Inventory\Models\StockLot;
use App\Domains\Inventory\Models\StockTransaction;
use App\Domains\Inventory\Repositories\StockLotRepository;
use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class StockLotLabelController extends Controller
{
    public function __construct(private StockLotRepository $stockLots) {}

    /**
     * Print labels for all lots created by a specific ENTRY/RETURN transaction.
     */
    public function byTransaction(StockTransaction $transaction): Response
    {
        $this->authorize('viewAny', StockTransaction::class);

        $lots = $this->stockLots->lotsCreatedByTransaction($transaction);

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
