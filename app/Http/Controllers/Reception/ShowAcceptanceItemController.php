<?php

namespace App\Http\Controllers\Reception;

use App\Domains\Laboratory\Enums\TestType;
use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Models\AcceptanceItem;
use App\Domains\Reception\Models\Report;
use App\Domains\Reception\Services\AcceptanceItemService;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class ShowAcceptanceItemController extends Controller
{
    public function __construct(private readonly AcceptanceItemService $acceptanceItemService)
    {
    }

    /**
     * Handle the incoming request.
     */
    public function __invoke(Acceptance $acceptance, AcceptanceItem $acceptanceItem)
    {
        $acceptanceItem->load("test");
        if ($acceptanceItem->test->type == TestType::SERVICE) {
            return redirect()->route('acceptances.show', $acceptanceItem->acceptance_id);
        }
        $acceptanceItem = $this->acceptanceItemService->showAcceptanceItem($acceptanceItem);

        // Check if user can create report for this acceptance item
        $canCreateReport = Gate::allows('create', [Report::class, $acceptanceItem]);

        // Check if user can toggle reportless status
        $canToggleReportless = Gate::allows('Reception.Acceptances.Toggle Reportless Acceptance Item');

        return Inertia::render("AcceptanceItem/Show", compact("acceptanceItem", "canCreateReport", "canToggleReportless"));
    }
}
