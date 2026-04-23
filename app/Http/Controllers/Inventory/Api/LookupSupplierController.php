<?php

namespace App\Http\Controllers\Inventory\Api;

use App\Domains\Inventory\Models\Supplier;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LookupSupplierController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $search = $request->input('search', '');

        $suppliers = Supplier::active()
            ->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%");
            })
            ->limit(20)
            ->get(['id', 'name', 'code']);

        return response()->json($suppliers);
    }
}
