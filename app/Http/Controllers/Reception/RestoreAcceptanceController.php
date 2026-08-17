<?php

declare(strict_types=1);

namespace App\Http\Controllers\Reception;

use App\Domains\Reception\Exceptions\AcceptanceNotDeletedException;
use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Services\AcceptanceService;
use App\Http\Controllers\Controller;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\RedirectResponse;

class RestoreAcceptanceController extends Controller
{
    public function __construct(private readonly AcceptanceService $acceptanceService)
    {
    }

    /**
     * Handle the incoming request.
     *
     * @throws AuthorizationException
     */
    public function __invoke(Acceptance $acceptance): RedirectResponse
    {
        $this->authorize("restore", $acceptance);
        $title = $acceptance->patient?->fullName ?: "Acceptance #{$acceptance->id}";

        try {
            $this->acceptanceService->restoreAcceptance($acceptance);
        } catch (AcceptanceNotDeletedException $e) {
            // Two people working the recovery list at once: the row was already
            // restored by the time this request landed.
            return back()->withErrors(["message" => $e->getMessage()]);
        }

        return back()->with(["success" => true, "status" => "$title Successfully Restored."]);
    }
}
