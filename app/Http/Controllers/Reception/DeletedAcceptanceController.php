<?php

declare(strict_types=1);

namespace App\Http\Controllers\Reception;

use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Services\AcceptanceService;
use App\Http\Controllers\Controller;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DeletedAcceptanceController extends Controller
{
    public function __construct(private readonly AcceptanceService $acceptanceService)
    {
        $this->middleware("indexProvider");
    }

    /**
     * The recovery list: acceptances that were deleted, newest first.
     *
     * @throws AuthorizationException
     */
    public function __invoke(Request $request): Response
    {
        $this->authorize("viewDeleted", Acceptance::class);
        $requestInputs = $request->all();

        return Inertia::render("Acceptance/Deleted", [
            "acceptances" => $this->acceptanceService->listDeletedAcceptances($requestInputs),
            "requestInputs" => $requestInputs,
        ]);
    }
}
