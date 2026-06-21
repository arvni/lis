<?php

namespace App\Http\Controllers\Inventory\Api;

use App\Domains\Inventory\Repositories\SupplierRepository;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LookupSupplierController extends Controller
{
    public function __construct(private SupplierRepository $suppliers) {}

    public function __invoke(Request $request): JsonResponse
    {
        $suppliers = $this->suppliers->searchActiveForLookup($request->input('search', ''));

        return response()->json($suppliers);
    }
}
