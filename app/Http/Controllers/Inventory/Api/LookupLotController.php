<?php

namespace App\Http\Controllers\Inventory\Api;

use App\Domains\Inventory\Repositories\StockLotRepository;
use App\Domains\Inventory\Requests\BarcodeScanRequest;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class LookupLotController extends Controller
{
    public function __construct(private StockLotRepository $stockLots) {}

    public function __invoke(BarcodeScanRequest $request): JsonResponse
    {
        $lot = $this->stockLots->findActiveByBarcode($request->input('barcode'));

        if (!$lot) {
            return response()->json(['message' => 'Lot not found'], 404);
        }

        return response()->json($lot);
    }
}
