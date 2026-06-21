<?php

namespace App\Http\Controllers\Inventory\Api;

use App\Domains\Inventory\Models\Item;
use App\Domains\Inventory\Repositories\StockLotRepository;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ItemLotsController extends Controller
{
    public function __construct(private StockLotRepository $stockLots) {}

    public function __invoke(Item $item, Request $request): JsonResponse
    {
        $lots = $this->stockLots->activeLotsForItem(
            $item->id,
            $request->integer('store_id') ?: null,
            $request->filled('search') ? $request->input('search') : null,
        )->map(fn($lot) => [
            'id'                  => $lot->id,
            'lot_number'          => $lot->lot_number,
            'brand'               => $lot->brand,
            'barcode'             => $lot->barcode,
            'expiry_date'         => $lot->expiry_date?->format('Y-m-d'),
            'quantity_base_units' => $lot->quantity_base_units,
            'store_id'            => $lot->store_id,
            'store_location_id'   => $lot->store_location_id,
        ]);

        return response()->json($lots);
    }
}
