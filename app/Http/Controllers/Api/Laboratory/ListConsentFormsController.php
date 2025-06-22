<?php

namespace App\Http\Controllers\Api\Laboratory;

use App\Domains\Laboratory\Services\ConsentFormService;
use App\Http\Controllers\Controller;
use App\Http\Resources\ListResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ListConsentFormsController extends Controller
{
    public function __construct(private readonly ConsentFormService $consentFormService)
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
        $requestForms = $this->consentFormService->listConsentForms($queryData);
        return ListResource::collection($requestForms);
    }
}
