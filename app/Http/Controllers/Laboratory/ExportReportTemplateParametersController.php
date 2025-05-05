<?php

namespace App\Http\Controllers\Laboratory;

use App\Domains\Laboratory\Exports\ReportTemplateParameterExport;
use App\Domains\Laboratory\Models\ReportTemplate;
use App\Domains\Laboratory\Services\ReportTemplateService;
use App\Http\Controllers\Controller;
use Maatwebsite\Excel\Facades\Excel;

class ExportReportTemplateParametersController extends Controller
{
    public function __construct(private ReportTemplateService $reportTemplateService)
    {
    }

    /**
     * Handle the incoming request.
     */
    public function __invoke(ReportTemplate $reportTemplate)
    {
        $parameters = $this->reportTemplateService->getParameters($reportTemplate);
        return Excel::download(new ReportTemplateParameterExport($parameters), "$reportTemplate->name parameters.xlsx");
    }
}
