<?php

namespace App\Http\Controllers\Inventory;

use App\Domains\Inventory\Models\WorkflowTemplate;
use App\Domains\Inventory\Requests\StoreWorkflowTemplateRequest;
use App\Domains\Inventory\Services\WorkflowTemplateService;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class WorkflowTemplateController extends Controller
{
    public function __construct(private WorkflowTemplateService $templateService) {}

    public function index(): Response
    {
        $this->authorize('viewAny', WorkflowTemplate::class);

        return Inertia::render('Inventory/WorkflowTemplates/Index', [
            'templates' => $this->templateService->listTemplates(),
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', WorkflowTemplate::class);

        return Inertia::render('Inventory/WorkflowTemplates/Form', [
            'template' => null,
            ...$this->templateService->formReferenceData(),
        ]);
    }

    public function store(StoreWorkflowTemplateRequest $request): RedirectResponse
    {
        $this->authorize('create', WorkflowTemplate::class);
        $template = $this->templateService->save(null, $request->validated());

        return redirect()->route('inventory.workflow-templates.index')
            ->with(['success' => true, 'status' => "Workflow template \"{$template->name}\" created."]);
    }

    public function edit(WorkflowTemplate $workflowTemplate): Response
    {
        $this->authorize('update', WorkflowTemplate::class);

        $workflowTemplate->load('steps.approverUser');

        return Inertia::render('Inventory/WorkflowTemplates/Form', [
            'template' => $workflowTemplate,
            ...$this->templateService->formReferenceData(),
        ]);
    }

    public function update(StoreWorkflowTemplateRequest $request, WorkflowTemplate $workflowTemplate): RedirectResponse
    {
        $this->authorize('update', WorkflowTemplate::class);
        $this->templateService->save($workflowTemplate, $request->validated());

        return redirect()->route('inventory.workflow-templates.index')
            ->with(['success' => true, 'status' => "Workflow template updated."]);
    }

    public function destroy(WorkflowTemplate $workflowTemplate): RedirectResponse
    {
        $this->authorize('delete', WorkflowTemplate::class);

        if (!$this->templateService->deleteIfUnused($workflowTemplate)) {
            return back()->with(['success' => false, 'status' => 'Cannot delete: template is used by existing purchase requests.']);
        }

        return redirect()->route('inventory.workflow-templates.index')
            ->with(['success' => true, 'status' => 'Workflow template deleted.']);
    }
}
