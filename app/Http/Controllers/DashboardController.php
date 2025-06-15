<?php

namespace App\Http\Controllers;

use App\Services\DashboardService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function __construct(private readonly DashboardService $dashboardService)
    {
    }

    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request)
    {
        $date = Carbon::parse($request->get('date',), "Asia/Muscat");
        return Inertia::render('Dashboard/Index', [
            "data" => $this->dashboardService->getDashboardData($date)->toArray(),
            "date" => $date->format('Y-m-d'),
        ]);
    }
}
