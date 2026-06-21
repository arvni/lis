<?php

namespace App\Http\Controllers\Inventory\Api;

use App\Domains\Inventory\Models\Store;
use App\Domains\Inventory\Repositories\StoreRepository;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StoreLocationsController extends Controller
{
    public function __construct(private StoreRepository $stores) {}

    public function __invoke(Store $store, Request $request): JsonResponse
    {
        $locations = $this->stores->locationsForLookup(
            $store,
            $request->integer('item_id') ?: null,
            $request->input('type'),
        );

        return response()->json($locations);
    }
}
