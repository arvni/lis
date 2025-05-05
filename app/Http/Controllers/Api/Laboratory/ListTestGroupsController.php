<?php

namespace App\Http\Controllers\Api\Laboratory;

use App\Domains\Laboratory\Services\TestGroupService;
use App\Http\Controllers\Controller;
use App\Http\Resources\ListResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ListTestGroupsController extends Controller
{
    public function __construct(private TestGroupService $testGroupService)
    {
        $this->middleware("indexProvider:name");
    }

    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request): AnonymousResourceCollection
    {
        $queryData = $request->all();
        $queryData["filters"]["active"] = true;
        $testGroups = $this->testGroupService->listTestGroups($queryData);
        return ListResource::collection($testGroups);
    }
}
