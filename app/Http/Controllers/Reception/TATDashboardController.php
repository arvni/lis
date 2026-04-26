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

        $sections = Section::orderBy('name')->get(['id', 'name']);
        $tests = Test::where('type', '!=', TestType::SERVICE->value)
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('TAT/Dashboard', [
            'summary'  => $this->tatService->getSummary($filters),
            'items_count' => $this->tatService->getItemsCount($filters),
            'sections' => $sections,
            'filters'  => $filters,
            'tests'    => $tests,
        ]);
    }
}
