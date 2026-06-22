<?php

namespace App\Http\Controllers\Inventory\Api;

use App\Domains\Inventory\Repositories\ItemRepository;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LookupItemController extends Controller
{
    public function __construct(private ItemRepository $items) {}

    public function __invoke(Request $request): JsonResponse
    {
        $items = $this->items->lookupForScan(
            $request->filled('barcode') ? $request->input('barcode') : null,
            $request->filled('search') ? $request->input('search') : null,
        );

        return response()->json($items);
    }
}
