<?php

namespace App\Http\Controllers\Api\Laboratory;

use App\Domains\Laboratory\Services\TestService;
use App\Http\Controllers\Controller;
use App\Http\Resources\ListResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ListTestsController extends Controller
{
    public function __construct(private TestService $testService)
    {
        $this->middleware("indexProvider:name");
    }

    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request): AnonymousResourceCollection
    {
        $queryData = $request->all();
        $queryData["filters"]["status"] = true;
        $tests = $this->testService->listTests($queryData);
        return ListResource::collection($tests);
    }
}
