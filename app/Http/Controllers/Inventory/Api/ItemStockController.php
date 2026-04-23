<?php

namespace App\Http\Controllers\Inventory\Api;

use App\Domains\Inventory\Models\Item;
use App\Domains\Inventory\Models\StockLot;
use App\Domains\Inventory\Services\UnitConversionService;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ItemStockController extends Controller
{
    public function __construct(private UnitConversionService $conversionService) {}

    public function __invoke(Item $item, Request $request): JsonResponse
    {
        $storeId = $request->integer('store_id') ?: null;

        $query = StockLot::where('item_id', $item->id)->where('status', 'ACTIVE');
        if ($storeId) $query->where('store_id', $storeId);

        $totalBase = (float) $query->sum('quantity_base_units');
        $formatted = $this->conversionService->formatStock($item->id, $totalBase);

        return response()->json([
            'total_base' => $totalBase,
            'formatted'  => $formatted,
            'is_low'     => $item->minimum_stock_level > 0 && $totalBase < (float) $item->minimum_stock_level,
        ]);
    }
}
