<?php

namespace App\Http\Controllers\Api\Laboratory;

use App\Domains\Laboratory\Services\SectionService;
use App\Http\Controllers\Controller;
use App\Http\Resources\ListResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ListActiveSectionsController extends Controller
{
    public function __construct(private SectionService $sectionService)
    {
        $this->middleware("indexProvider:name");
    }

    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request): AnonymousResourceCollection
    {
        $queryData = $request->all();
        $queryData["filters"]["active"]=true;
        $sections = $this->sectionService->listSections($queryData);
        return ListResource::collection($sections);
    }
}
