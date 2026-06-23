<?php

namespace App\Http\Controllers\Reception;

use App\Domains\Reception\Requests\SampleCollectionRequest;
use App\Domains\Reception\Services\AcceptanceService;
use App\Http\Controllers\Controller;
use Inertia\Inertia;

class SampleCollectionController extends Controller
{
    public function __construct(private readonly AcceptanceService $acceptanceService)
    {
        $this->middleware("indexProvider");
    }

    public function __invoke(SampleCollectionRequest $request): \Inertia\Response
    {
        $requestInputs = $request->all();
        $acceptances = $this->acceptanceService->listSampleCollections($requestInputs);

        return Inertia::render("Sample/SampleCollection", compact("acceptances", "requestInputs"));
    }
}
