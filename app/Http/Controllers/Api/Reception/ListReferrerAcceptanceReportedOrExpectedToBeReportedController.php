<?php

namespace App\Http\Controllers\Api\Reception;

use App\Domains\Reception\Services\AcceptanceService;
use App\Http\Controllers\Controller;
use App\Http\Resources\AcceptanceResource;
use Illuminate\Http\Request;

class ListReferrerAcceptanceReportedOrExpectedToBeReportedController extends Controller
{
    public function __construct(private AcceptanceService $acceptanceService)
    {
    }

    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request)
    {
        $acceptances = $this->acceptanceService->getReferrerAcceptanceReported($request->input("referrer.id"), $request->input("date"));
        return AcceptanceResource::collection($acceptances);
    }
}
