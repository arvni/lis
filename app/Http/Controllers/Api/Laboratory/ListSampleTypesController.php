<?php

namespace App\Http\Controllers\Api\Laboratory;

use App\Domains\Laboratory\Services\SampleTypeService;
use App\Http\Controllers\Controller;
use App\Http\Resources\ListResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ListSampleTypesController extends Controller
{
    public function __construct(private SampleTypeService $sampleTypeService)
    {
        $this->middleware("indexProvider:name");
    }

    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request): AnonymousResourceCollection
    {
        $queryData = $request->all();
        $sampleTypes = $this->sampleTypeService->listSampleTypes($queryData);
        return ListResource::collection($sampleTypes);
    }
}
