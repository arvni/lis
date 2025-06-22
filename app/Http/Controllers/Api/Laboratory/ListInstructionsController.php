<?php

namespace App\Http\Controllers\Api\Laboratory;

use App\Domains\Laboratory\Services\InstructionService;
use App\Http\Controllers\Controller;
use App\Http\Resources\ListResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ListInstructionsController extends Controller
{
    public function __construct(private readonly InstructionService $instructionService)
    {
        $this->middleware("indexProvider:name");
    }

    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request): AnonymousResourceCollection
    {
        $request->mergeIfMissing(["filters" => ["active" => true]]);
        $queryData = $request->all();
        $requestForms = $this->instructionService->listInstructions($queryData);
        return ListResource::collection($requestForms);
    }
}
