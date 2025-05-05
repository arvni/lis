<?php

namespace App\Http\Controllers\Api\Laboratory;

use App\Domains\Laboratory\Services\SectionGroupService;
use App\Http\Controllers\Controller;
use App\Http\Resources\ListResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ListSectionGroupsController extends Controller
{
    public function __construct(private SectionGroupService $sectionGroupService)
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
        $sectionGroups = $this->sectionGroupService->listSectionGroups($queryData);
        return ListResource::collection($sectionGroups);
    }
}
