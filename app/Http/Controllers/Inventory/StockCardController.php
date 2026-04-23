<?php

namespace App\Http\Controllers\Inventory;

use App\Domains\Inventory\Models\Item;
use App\Domains\Inventory\Models\Store;
use App\Domains\Inventory\Services\StockCardService;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StockCardController extends Controller
{
    public function __construct(private StockCardService $stockCardService) {}

    public function __invoke(Item $item, Request $request): Response
    {
        $storeId   = $request->integer('store_id') ?: null;
        $stockCard = $this->stockCardService->getStockCard($item->id, $storeId);
        $stores    = Store::active()->get(['id', 'name']);

        return Inertia::render('Inventory/Stock/Card', compact('stockCard', 'stores', 'storeId'));
    }
}
