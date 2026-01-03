<?php

namespace App\Http\Controllers\Reception;

use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Services\AcceptanceService;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class ApproveFinancialController extends Controller
{
    public function __construct(
        private readonly AcceptanceService $acceptanceService
    )
    {
    }

    /**
     * Approve financial check for acceptance
     */
    public function __invoke(Acceptance $acceptance, Request $request)
    {
        // Check permission using policy
        $this->authorize('approveFinancial', $acceptance);

        $user = auth()->user();

        // Approve financial
        $this->acceptanceService->approveFinancial($acceptance, $user->id);

        return back()->with([
            "success" => true,
            "status" => "Financial check approved for acceptance #{$acceptance->id}"
        ]);
    }
}
