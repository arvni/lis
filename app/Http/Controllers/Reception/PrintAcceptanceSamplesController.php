<?php

namespace App\Http\Controllers\Reception;

use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Services\AcceptanceService;
use App\Domains\Reception\Services\SampleService;
use App\Http\Controllers\Controller;
use Illuminate\Auth\Access\AuthorizationException;
use Inertia\Inertia;
use Inertia\Response;

class PrintAcceptanceSamplesController extends Controller
{
    public function __construct(private readonly AcceptanceService $acceptanceService, private readonly SampleService $sampleService)
    {
    }

    /**
     * Handle the incoming request.
     * @throws AuthorizationException
     */
    public function __invoke(Acceptance $acceptance): Response
    {
        $this->authorize('view', $acceptance);
        $acceptanceData = $this->acceptanceService->prepareAcceptanceForEdit($acceptance);
        $samples = $this->sampleService->listSampleBarcodes(["acceptance_id" => $acceptance->id])->load('sampleType');
        return Inertia::render("Acceptance/PrintSamples", ["acceptance" => $acceptanceData, "samples" => $samples]);
    }
}
