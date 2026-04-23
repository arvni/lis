<?php

namespace App\Http\Controllers\Inventory\Api;

use App\Domains\Inventory\Models\Item;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ItemLotsController extends Controller
{
    public function __invoke(Item $item, Request $request): JsonResponse
    {
        $lots = $item->lots()
            ->where('status', 'ACTIVE')
            ->where('quantity_base_units', '>', 0)
            ->when($request->filled('store_id'), fn($q) => $q->where('store_id', $request->input('store_id')))
            ->when($request->filled('search'), fn($q) => $q->where(function ($q2) use ($request) {
                $term = $request->input('search');
                $q2->where('lot_number', 'like', "%{$term}%")
                   ->orWhere('brand', 'like', "%{$term}%");
            }))
            ->orderBy('received_date')
            ->get(['id', 'lot_number', 'brand', 'barcode', 'expiry_date', 'quantity_base_units', 'store_id', 'store_location_id'])
            ->map(fn($lot) => [
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
