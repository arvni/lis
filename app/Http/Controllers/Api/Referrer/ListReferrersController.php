<?php

namespace App\Http\Controllers\Api\Referrer;

use App\Domains\Referrer\Services\ReferrerService;
use App\Http\Controllers\Controller;
use App\Http\Resources\ListResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ListReferrersController extends Controller
{
    public function __construct(private ReferrerService $referrerService)
    {
        $this->middleware("indexProvider:name");
    }

    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request): AnonymousResourceCollection
    {
        $queryData = $request->all();
        $referrers = $this->referrerService->listReferrers($queryData);
        return ListResource::collection($referrers);
    }
}
