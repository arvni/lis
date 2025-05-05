<?php

namespace App\Http\Controllers\Reception;

use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Services\AcceptanceService;
use App\Http\Controllers\Controller;
use Illuminate\Auth\Access\AuthorizationException;
use Inertia\Inertia;
use Inertia\Response;

class PrintAcceptanceController extends Controller
{
    public function __construct(private readonly AcceptanceService $acceptanceService)
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
        return Inertia::render("Acceptance/Print", ["acceptance" => $acceptanceData]);
    }
}
