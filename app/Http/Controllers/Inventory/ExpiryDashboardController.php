<?php

namespace App\Http\Controllers\Inventory;

use App\Domains\Inventory\Models\StockLot;
use App\Domains\Inventory\Models\StockTransaction;
use App\Domains\Inventory\Models\Store;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ExpiryDashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $this->authorize('viewAny', StockTransaction::class);

        $storeId  = $request->integer('store_id') ?: null;
        $window   = $request->integer('days', 90);

        $base = StockLot::with(['item', 'store', 'location'])
            ->where('status', 'ACTIVE')
            ->where('quantity_base_units', '>', 0)
            ->whereNotNull('expiry_date')
            ->when($storeId, fn($q) => $q->where('store_id', $storeId))
            ->orderBy('expiry_date', 'asc');

        $expired = (clone $base)->where('expiry_date', '<', now())->get();

        $expiringSoon = (clone $base)
            ->whereDate('expiry_date', '>=', now())
            ->whereDate('expiry_date', '<=', now()->addDays($window))
            ->get();

        $stores = Store::active()->get(['id', 'name']);

        return Inertia::render('Inventory/Expiry/Index', compact(
            'expired', 'expiringSoon', 'stores', 'storeId', 'window'
        ));
    }
}
