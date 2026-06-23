<?php

namespace App\Http\Controllers\Reception;

use App\Domains\Reception\Requests\TATDashboardRequest;
use App\Domains\Reception\Services\TATService;
use App\Http\Controllers\Controller;
use Inertia\Inertia;

class TATDashboardController extends Controller
{
    public function __construct(private readonly TATService $tatService)
    {
    }

    public function __invoke(TATDashboardRequest $request): \Inertia\Response
    {
        $filters = $request->only(['priority', 'section_id', 'date_from', 'date_to']);

        return Inertia::render('TAT/Dashboard', [
            'summary'     => $this->tatService->getSummary($filters),
            'items_count' => $this->tatService->getItemsCount($filters),
            'filters'     => $filters,
        ]);
    }
}
