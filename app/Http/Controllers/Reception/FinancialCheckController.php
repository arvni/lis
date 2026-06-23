<?php

namespace App\Http\Controllers\Reception;

use App\Domains\Reception\Requests\FinancialCheckRequest;
use App\Domains\Reception\Services\AcceptanceService;
use App\Http\Controllers\Controller;
use Inertia\Inertia;

class FinancialCheckController extends Controller
{
    public function __construct(
        private readonly AcceptanceService $acceptanceService,
    )
    {
        $this->middleware("indexProvider");
    }

    public function __invoke(FinancialCheckRequest $request): \Inertia\Response
    {
        $requestInputs = $request->all();

        // Get acceptances in WAITING_FOR_PUBLISHING status
        $acceptances = $this->acceptanceService->listWaitingForFinancialCheck($requestInputs);

        return Inertia::render('Acceptance/FinancialCheck', compact("acceptances", "requestInputs"));
    }
}
