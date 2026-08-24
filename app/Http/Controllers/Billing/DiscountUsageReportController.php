<?php

declare(strict_types=1);

namespace App\Http\Controllers\Billing;

use App\Domains\Billing\Requests\DiscountUsageReportRequest;
use App\Domains\Billing\Services\DiscountUsageReportService;
use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class DiscountUsageReportController extends Controller
{
    public function __construct(private readonly DiscountUsageReportService $reportService) {}

    public function __invoke(DiscountUsageReportRequest $request): Response
    {
        return Inertia::render('DiscountUsage/Index', $this->reportService->report($request->filters()));
    }
}
