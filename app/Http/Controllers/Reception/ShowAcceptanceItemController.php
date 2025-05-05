<?php

namespace App\Http\Controllers\Reception;

use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Models\AcceptanceItem;
use App\Domains\Reception\Services\AcceptanceItemService;
use App\Http\Controllers\Controller;
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
        $acceptanceItem = $this->acceptanceItemService->showAcceptanceItem($acceptanceItem);
        return Inertia::render("AcceptanceItem/Show", compact("acceptanceItem"));
    }
}
