<?php

namespace App\Http\Controllers\Inventory\Api;

use App\Domains\Inventory\Models\Item;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LookupItemController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $query = Item::with('defaultUnit')
            ->active()
            ->limit(20);

        if ($request->filled('barcode')) {
            $query->where('item_code', $request->input('barcode'));
        } elseif ($request->filled('search')) {
            $query->search($request->input('search'));
        }

        return response()->json($query->get(['id', 'item_code', 'name', 'default_unit_id']));
    }
}
