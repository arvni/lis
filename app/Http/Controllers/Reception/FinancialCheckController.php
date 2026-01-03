<?php

namespace App\Http\Controllers\Reception;

use App\Domains\Reception\Enums\AcceptanceStatus;
use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Services\AcceptanceService;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FinancialCheckController extends Controller
{
    public function __construct(
        private readonly AcceptanceService $acceptanceService,
    )
    {
        $this->middleware("indexProvider");
    }

    /**
     * Display acceptances waiting for financial approval
     */
    public function __invoke(Request $request)
    {
        // Check permission using policy
        $this->authorize('financialCheck', Acceptance::class);

        $requestInputs = $request->all();

        // Get acceptances in WAITING_FOR_PUBLISHING status
        $acceptances = $this->acceptanceService->listWaitingForFinancialCheck($requestInputs);

        return Inertia::render('Acceptance/FinancialCheck', compact("acceptances", "requestInputs"));
    }
}
