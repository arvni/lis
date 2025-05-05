<?php

namespace App\Http\Controllers\Api\Laboratory;

use App\Domains\Laboratory\Services\WorkflowService;
use App\Http\Controllers\Controller;
use App\Http\Resources\ListResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ListWorkflowsController extends Controller
{
    public function __construct(private WorkflowService $workflowService)
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
        $workflows = $this->workflowService->listWorkflows($queryData);
        return ListResource::collection($workflows);
    }
}
