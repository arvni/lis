<?php

declare(strict_types=1);

namespace App\Http\Controllers\Billing;

use App\Domains\Billing\Exports\DiscountUsageExport;
use App\Domains\Billing\Requests\DiscountUsageReportRequest;
use App\Domains\Billing\Services\DiscountUsageReportService;
use App\Http\Controllers\Controller;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ExportDiscountUsageController extends Controller
{
    public function __construct(private readonly DiscountUsageReportService $reportService) {}

    public function __invoke(DiscountUsageReportRequest $request): BinaryFileResponse
    {
        $filters = $this->reportService->withDefaults($request->filters());
        $rows = $this->reportService->rows($filters);

        return Excel::download(
            new DiscountUsageExport($rows),
            "discount-usage-{$filters['from_date']}-to-{$filters['to_date']}.xlsx"
        );
    }
}
