<?php

namespace App\Http\Controllers\Referrer;

use App\Domains\Referrer\Models\Referrer;
use App\Domains\Referrer\Services\ReferrerService;
use App\Domains\Referrer\Services\ReferrerTestService;
use App\Http\Controllers\Controller;
use Exception;
use Illuminate\Http\Request;

class CopyReferrerTestsFromOtherReferrerController extends Controller
{
    public function __construct(private ReferrerTestService $referrerTestService, private ReferrerService $referrerService)
    {
    }

    /**
     * Handle the incoming request.
     * @throws Exception
     */
    public function __invoke(Referrer $referrer, Request $request)
    {
        if ($request->has("source.id")) {
            $sourceReferrer = $this->referrerService->getReferrerById($request->input("source.id"));
            if ($sourceReferrer) {
                $this->referrerTestService->copyFromOtherReferrer($sourceReferrer, $referrer);
                return back()->with("success", "Referrer copied successfully");
            }
        }
        return back()->withErrors("Referrer not found");
    }
}
