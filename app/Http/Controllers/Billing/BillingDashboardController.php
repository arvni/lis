<?php

namespace App\Http\Controllers\Billing;

use App\Domains\Billing\Services\BillingDashboardService;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class BillingDashboardController extends Controller
{
    public function __construct(private readonly BillingDashboardService $service)
    {
    }

    public function __invoke(Request $request)
    {
        Gate::authorize('Billing.Dashboard.View Dashboard');

        $filters = $request->only(['preset', 'from', 'to', 'referrer_id']);

        return Inertia::render('Billing/Dashboard', [
            'summary' => $this->service->getSummary($filters),
            'filters' => $filters,
        ]);
    }
}
