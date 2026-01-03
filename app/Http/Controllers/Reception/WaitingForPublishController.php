<?php

namespace App\Http\Controllers\Reception;

use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Models\Report;
use App\Domains\Reception\Services\AcceptanceService;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class WaitingForPublishController extends Controller
{
    public function __construct(
        private readonly AcceptanceService $acceptanceService,
    )
    {
        $this->middleware("indexProvider");
    }

    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request)
    {
        Gate::allows("publish", new Report());
        $requestInputs = $request->all();
        $acceptances = $this->acceptanceService->listWaitingForPublish($requestInputs);
        $canEdit = Gate::allows("edit", new Report());
        return Inertia::render('Report/Publish', compact("acceptances", "requestInputs", "canEdit"));
    }
}
