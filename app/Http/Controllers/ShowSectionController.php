<?php

namespace App\Http\Controllers;

use App\Domains\Laboratory\Models\Section;
use App\Domains\Reception\Services\AcceptanceItemStateService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ShowSectionController extends Controller
{
    public function __construct(private readonly AcceptanceItemStateService $acceptanceItemStateService)
    {
        $this->middleware("indexProvider:created_at,desc");
    }

    /**
     * Handle the incoming request.
     * @throws AuthorizationException
     */
    public function __invoke(Section $section, Request $request)
    {
        $section->load("sectionGroup");
        $this->authorize("view", $section);

        $requestInputs = $request->all();

        $stats = $this->acceptanceItemStateService->getAcceptanceItemStatesStats($section->id)
            ->keyBy(fn($item) => $item->status->value)
            ->map(fn($item) => $item->total);
        $stats["total"] = $stats->sum();

        $acceptanceItemStates = $this->acceptanceItemStateService->listAcceptanceItemStates([
            ...$requestInputs,
            "filters" => [
                ...$requestInputs["filters"],
                "section_id" => $section->id
            ]
        ]);
        return Inertia::render("Section/Show",
            compact(
                "section",
                "acceptanceItemStates",
                "requestInputs",
                "stats"
            ));
    }
}
