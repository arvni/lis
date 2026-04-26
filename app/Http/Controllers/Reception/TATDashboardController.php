<?php

namespace App\Http\Controllers\Reception;

use App\Domains\Laboratory\Enums\TestType;
use App\Domains\Laboratory\Models\Section;
use App\Domains\Laboratory\Models\Test;
use App\Domains\Reception\Services\TATService;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class TATDashboardController extends Controller
{
    public function __construct(private readonly TATService $tatService)
    {
    }

    public function __invoke(Request $request)
    {
        Gate::authorize('Reception.TAT.View Dashboard');

        $filters = $request->only(['priority', 'section_id', 'date_from', 'date_to']);
        $analyticsFilters = $request->only(['a_preset', 'a_from', 'a_to', 'a_test_id']);

        $sections = Section::orderBy('name')->get(['id', 'name']);
        $tests = Test::where('type', '!=', TestType::SERVICE->value)
            ->orderBy('name')
            ->get(['id', 'name']);

        [$analyticsFrom, $analyticsTo] = $this->tatService->resolveAnalyticsDates($analyticsFilters);

        return Inertia::render('TAT/Dashboard', [
            'summary' => $this->tatService->getSummary($filters),
            'items' => $this->tatService->getItems($filters)->values(),
            'sections' => $sections,
            'filters' => $filters,
            'analytics' => $this->tatService->getTestAnalytics($analyticsFilters),
            'analyticsFilters' => $analyticsFilters,
            'analyticsDates' => [
                'from' => $analyticsFrom->toDateString(),
                'to' => $analyticsTo->toDateString(),
            ],
            'tests' => $tests,
        ]);
    }
}
