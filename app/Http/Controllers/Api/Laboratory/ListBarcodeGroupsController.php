<?php

namespace App\Http\Controllers\Api\Laboratory;

use App\Domains\Laboratory\Services\BarcodeGroupService;
use App\Http\Controllers\Controller;
use App\Http\Resources\ListResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ListBarcodeGroupsController extends Controller
{
    public function __construct(private BarcodeGroupService $barcodeGroupService)
    {
        $this->middleware("indexProvider:name");
    }

    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request): AnonymousResourceCollection
    {
        $queryData = $request->all();
        $barcodeGroups = $this->barcodeGroupService->listBarcodeGroups($queryData);
        return ListResource::collection($barcodeGroups);
    }
}
