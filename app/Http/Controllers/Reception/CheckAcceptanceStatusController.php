<?php

namespace App\Http\Controllers\Reception;

use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Services\AcceptanceService;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class CheckAcceptanceStatusController extends Controller
{
    public function __construct(
        private readonly AcceptanceService $acceptanceService
    )
    {
    }

    /**
     * Check and update acceptance status
     */
    public function __invoke(Acceptance $acceptance, Request $request)
    {
        // Check permission using policy
        $this->authorize('checkStatus', $acceptance);

        // Run the status check
        $this->acceptanceService->checkAndUpdateAcceptanceStatus($acceptance);

        // Refresh the acceptance to get updated status
        $acceptance->refresh();

        return back()->with([
            "success" => true,
            "status" => "Status checked and updated. Current status: " . $acceptance->status->value
        ]);
    }
}
