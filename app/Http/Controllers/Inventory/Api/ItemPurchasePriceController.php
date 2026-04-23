<?php

namespace App\Http\Controllers\Inventory\Api;

use App\Domains\Inventory\Models\SupplierItem;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ItemPurchasePriceController extends Controller
{
    /**
     * Returns last purchase price(s) for an item across all (or one) suppliers.
     * Query params: item_id, supplier_id (optional)
     */
    public function __invoke(Request $request): JsonResponse
    {
        $itemId     = $request->integer('item_id');
        $supplierId = $request->integer('supplier_id') ?: null;

        if (!$itemId) return response()->json([]);

        $records = SupplierItem::with('supplier')
            ->where('item_id', $itemId)
            ->when($supplierId, fn($q) => $q->where('supplier_id', $supplierId))
            ->whereNotNull('last_purchase_price')
            ->orderByDesc('last_purchase_price')
            ->get(['id', 'supplier_id', 'last_purchase_price', 'currency', 'unit_id', 'is_preferred'])
            ->map(fn($si) => [
                'supplier_id'         => $si->supplier_id,
                'supplier_name'       => $si->supplier?->name,
                'last_purchase_price' => (float) $si->last_purchase_price,
                'currency'            => $si->currency ?? 'OMR',
                'is_preferred'        => $si->is_preferred,
            ]);

        return response()->json($records);
    }
}
