<?php

namespace App\Http\Controllers\Api\Billing;

use App\Domains\Billing\Services\BillingDashboardService;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class BillingTrendController extends Controller
{
    public function __construct(private readonly BillingDashboardService $service)
    {
    }

    public function __invoke(Request $request): JsonResponse
    {
        Gate::authorize('Billing.Dashboard.View Dashboard');

        $filters = $request->only(['t_has_invoice', 't_referrer_id', 't_test_id', 't_months']);

        return response()->json($this->service->getByMonth($filters));
    }
}
