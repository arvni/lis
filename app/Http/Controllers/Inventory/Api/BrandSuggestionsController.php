<?php

namespace App\Http\Controllers\Inventory\Api;

use App\Domains\Inventory\Repositories\StockTransactionRepository;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BrandSuggestionsController extends Controller
{
    public function __construct(private StockTransactionRepository $stockTransactions) {}

    public function __invoke(Request $request): JsonResponse
    {
        $itemId = $request->integer('item_id') ?: null;

        if (!$itemId) {
            return response()->json([]);
        }

        $brands = $this->stockTransactions->brandSuggestionsForItem(
            $itemId,
            $request->filled('search') ? $request->input('search') : null,
        );

        return response()->json($brands);
    }
}
