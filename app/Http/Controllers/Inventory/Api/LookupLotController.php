<?php

namespace App\Http\Controllers\Inventory\Api;

use App\Domains\Inventory\Models\StockLot;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LookupLotController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $request->validate(['barcode' => 'required|string']);

        $lot = StockLot::with(['item.defaultUnit', 'store', 'location'])
            ->where('barcode', $request->input('barcode'))
            ->where('status', 'ACTIVE')
            ->first();

        if (!$lot) {
            return response()->json(['message' => 'Lot not found'], 404);
        }

        return response()->json($lot);
    }
}
