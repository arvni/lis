<?php

namespace App\Http\Controllers\Inventory\Api;

use App\Domains\Inventory\Models\StockTransactionLine;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BrandSuggestionsController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $itemId = $request->input('item_id');
        $search = $request->input('search', '');

        if (!$itemId) return response()->json([]);

        $brands = StockTransactionLine::where('item_id', $itemId)
            ->whereNotNull('brand')
            ->where('brand', '!=', '')
            ->when($search, fn($q) => $q->where('brand', 'like', "%{$search}%"))
            ->distinct()
            ->orderBy('brand')
            ->limit(20)
            ->pluck('brand');

        return response()->json($brands);
    }
}
