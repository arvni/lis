<?php

namespace App\Http\Controllers\Api\Billing;

use App\Domains\Billing\Services\BillingDashboardService;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class BillingDashboardDataController extends Controller
{
    public function __construct(private readonly BillingDashboardService $service)
    {
    }

    public function __invoke(Request $request): JsonResponse
    {
        Gate::authorize('Billing.Dashboard.View Dashboard');

        $filters = $request->only(['preset', 'from', 'to', 'referrer_id', 'has_invoice', 'payment_method', 'test_ids']);

        return response()->json([
            'by_test'           => $this->service->getByTest($filters),
            'by_referrer'       => $this->service->getByReferrer($filters),
            'by_payment_method' => $this->service->getByPaymentMethod($filters),
        ]);
    }
}
