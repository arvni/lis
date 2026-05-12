<?php

namespace App\Http\Controllers\Billing;

use App\Domains\Billing\Exports\DailyCashReportExport;
use App\Domains\Billing\Requests\DailyCashReportRequest;
use App\Domains\Billing\Services\DailyCashReportService;
use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Maatwebsite\Excel\Facades\Excel;

class DailyCashReportController extends Controller
{
    public function __construct(private readonly DailyCashReportService $reportService) {}

    public function __invoke(DailyCashReportRequest $request)
    {
        $date = Carbon::parse($request->input('date'));
        $data = $this->reportService->buildReportData($date);
        $fileName = 'Daily_report_' . $date->format('Ymd') . '.xlsx';

        return Excel::download(new DailyCashReportExport(collect($data), $date), $fileName);
    }
}
