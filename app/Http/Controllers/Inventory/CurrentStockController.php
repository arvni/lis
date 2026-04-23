<?php

namespace App\Http\Controllers\Inventory;

use App\Domains\Inventory\Models\Store;
use App\Domains\Inventory\Services\StockCardService;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CurrentStockController extends Controller
{
    public function __construct(private StockCardService $stockCardService) {}

    public function __invoke(Request $request): Response
    {
        $storeId = $request->integer('store_id') ?: null;
        $filters = $request->only(['search', 'department', 'material_type', 'low_stock_only']);
        $stock   = $this->stockCardService->getCurrentStock($storeId, $filters);
        $stores  = Store::active()->get(['id', 'name']);

        return Inertia::render('Inventory/Stock/Index', compact('stock', 'stores', 'storeId', 'filters'));
    }
}
