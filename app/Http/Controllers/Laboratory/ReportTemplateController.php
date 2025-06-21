<?php

namespace App\Http\Controllers\Laboratory;

use App\Domains\Laboratory\DTOs\ReportTemplateDTO;
use App\Domains\Laboratory\Models\ReportTemplate;
use App\Domains\Laboratory\Requests\StoreReportTemplateRequest;
use App\Domains\Laboratory\Requests\UpdateReportTemplateRequest;
use App\Domains\Laboratory\Services\ReportTemplateService;
use App\Http\Controllers\Controller;
use Exception;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReportTemplateController extends Controller
{
    public function __construct(protected ReportTemplateService $reportTemplateService)
    {
        $this->middleware('indexProvider')->only('index');
    }

    /**
     * @throws AuthorizationException
     */
    public function index(Request $request): Response
    {
        $this->authorize("viewAny", ReportTemplate::class);
        $reportTemplates = $this->reportTemplateService->listReportTemplates($request->all());
        return Inertia::render('ReportTemplate/Index', [
            'reportTemplates' => $reportTemplates,
            'requestInputs' => $request->all()
        ]);
    }

    public function store(StoreReportTemplateRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $reportTemplateDto = new ReportTemplateDTO(
            $validated['name'],
            $validated['template'],
            $validated['parameters']
        );
        $this->reportTemplateService->storeReportTemplate($reportTemplateDto);
        return redirect()->route('reportTemplates.index')->with('success', 'Report Template created successfully.');
    }

    public function show(ReportTemplate $reportTemplate)
    {
        $template = $this->reportTemplateService->getTemplate($reportTemplate);
        abort_unless(!!$template, 404);
        return redirect()->route("documents.show", $template);
    }

    public function update(UpdateReportTemplateRequest $request, ReportTemplate $reportTemplate): RedirectResponse
    {
        $validated = $request->validated();
        $reportTemplateDto = new ReportTemplateDTO(
            $validated['name'],
            $validated['template'],
            $validated['parameters']
        );
        $this->reportTemplateService->updateReportTemplate($reportTemplate, $reportTemplateDto);
        return redirect()->route('reportTemplates.index')->with('success', 'Report Template updated successfully.');
    }

    /**
     * @throws AuthorizationException
     * @throws Exception
     */
    public function destroy(ReportTemplate $reportTemplate): RedirectResponse
    {
        $this->authorize("delete", $reportTemplate);
        $this->reportTemplateService->deleteReportTemplate($reportTemplate);
        return redirect()->route('reportTemplates.index')->with('success', 'Report Template deleted successfully.');
    }
}
