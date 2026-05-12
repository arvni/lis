<?php

namespace App\Http\Controllers\Reception;

use App\Domains\Reception\Models\Report;
use App\Domains\Reception\Requests\WaitingForPublishRequest;
use App\Domains\Reception\Services\AcceptanceService;
use App\Http\Controllers\Controller;
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

    public function __invoke(WaitingForPublishRequest $request)
    {
        $requestInputs = $request->all();
        $acceptances = $this->acceptanceService->listWaitingForPublish($requestInputs);
        $canEdit = Gate::allows("edit", new Report());
        return Inertia::render('Report/Publish', compact("acceptances", "requestInputs", "canEdit"));
    }
}
