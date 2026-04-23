<?php

namespace App\Http\Controllers\Inventory\Api;

use App\Domains\Inventory\Models\Store;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StoreLocationsController extends Controller
{
    public function __invoke(Store $store, Request $request): JsonResponse
    {
        $itemId = $request->input('item_id');
        $type   = $request->input('type');

        $query = $store->locations()->active();

        if ($itemId && $type) {
            $isOutbound = in_array($type, ['EXPORT', 'RETURN', 'EXPIRED_REMOVAL', 'TRANSFER']);

            if ($isOutbound) {
                // Outbound: only locations currently holding this item with available stock
                $query->whereHas('lots', fn($q) => $q
                    ->where('item_id', $itemId)
                    ->where('status', 'ACTIVE')
                    ->where('quantity_base_units', '>', 0)
                );
            }
            // ENTRY/ADJUST: all active locations are valid — no filter applied
        }

        return response()->json(
            $query->get(['id', 'label', 'zone', 'row', 'shelf', 'bin'])
        );
    }
}
