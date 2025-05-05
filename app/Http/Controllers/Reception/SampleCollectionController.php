<?php

namespace App\Http\Controllers\Reception;

use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Services\AcceptanceService;
use App\Http\Controllers\Controller;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SampleCollectionController extends Controller
{
    public function __construct(private readonly AcceptanceService $acceptanceService)
    {
        $this->middleware("indexProvider");
    }

    /**
     * Handle the incoming request.
     * @throws AuthorizationException
     */
    public function __invoke(Request $request)
    {
        $this->authorize("sampleCollection", Acceptance::class);
        $requestInputs = $request->all();
        $acceptances = $this->acceptanceService->listSampleCollections($requestInputs);

        return Inertia::render("Sample/SampleCollection", compact("acceptances", "requestInputs"));
    }
}
