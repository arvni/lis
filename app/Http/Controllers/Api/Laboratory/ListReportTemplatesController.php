<?php

namespace App\Http\Controllers\Api\Laboratory;

use App\Domains\Laboratory\Services\ReportTemplateService;
use App\Http\Controllers\Controller;
use App\Http\Resources\ListResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ListReportTemplatesController extends Controller
{
    public function __construct(private ReportTemplateService $reportTemplateService)
    {
        $this->middleware("indexProvider:name");
    }

    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request): AnonymousResourceCollection
    {
        $queryData = $request->all();
        $queryData["filters"]["active"] = true;
        $reportTemplates = $this->reportTemplateService->listReportTemplates($queryData);
        return ListResource::collection($reportTemplates);
    }
}
