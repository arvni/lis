<?php

namespace App\Http\Controllers\Api\Reception;

use App\Domains\Reception\Services\TATService;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class TATAnalyticsController extends Controller
{
    public function __construct(private readonly TATService $tatService)
    {
    }

    public function __invoke(Request $request): JsonResponse
    {
        Gate::authorize('Reception.TAT.View Dashboard');

        $filters = $request->only(['a_preset', 'a_from', 'a_to', 'a_test_id']);
        [$from, $to] = $this->tatService->resolveAnalyticsDates($filters);

        return response()->json([
            'data' => $this->tatService->getTestAnalytics($filters),
            'dates' => [
                'from' => $from->toDateString(),
                'to'   => $to->toDateString(),
            ],
        ]);
    }
}
