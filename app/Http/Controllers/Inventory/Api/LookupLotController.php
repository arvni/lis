<?php

namespace App\Http\Controllers\Inventory\Api;

use App\Domains\Inventory\Models\StockLot;
use App\Domains\Inventory\Requests\BarcodeScanRequest;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class LookupLotController extends Controller
{
    public function __invoke(BarcodeScanRequest $request): JsonResponse
    {
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
