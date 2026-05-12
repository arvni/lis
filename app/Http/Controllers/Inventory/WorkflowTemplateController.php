<?php

namespace App\Http\Controllers\Inventory;

use App\Domains\Inventory\Models\WorkflowTemplate;
use App\Domains\Inventory\Requests\StoreWorkflowTemplateRequest;
use App\Http\Controllers\Controller;
use App\Domains\User\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class WorkflowTemplateController extends Controller
{
    public function index(): Response
    {
        $this->authorize('viewAny', WorkflowTemplate::class);

        $templates = WorkflowTemplate::with('steps.approverUser')
            ->withCount('purchaseRequests')
            ->orderBy('name')
            ->get();

        return Inertia::render('Inventory/WorkflowTemplates/Index', compact('templates'));
    }

    public function create(): Response
    {
        $this->authorize('create', WorkflowTemplate::class);

        return Inertia::render('Inventory/WorkflowTemplates/Form', [
            'template'  => null,
            'users'     => User::orderBy('name')->get(['id', 'name']),
            'roles'     => Role::orderBy('name')->pluck('name'),
            'urgencies' => ['LOW', 'NORMAL', 'HIGH', 'URGENT'],
        ]);
    }

    public function store(StoreWorkflowTemplateRequest $request): RedirectResponse
    {
        $this->authorize('create', WorkflowTemplate::class);
        $template = $this->saveTemplate(null, $request->validated());

        return redirect()->route('inventory.workflow-templates.index')
            ->with(['success' => true, 'status' => "Workflow template \"{$template->name}\" created."]);
    }

    public function edit(WorkflowTemplate $workflowTemplate): Response
    {
        $this->authorize('update', WorkflowTemplate::class);

        $workflowTemplate->load('steps.approverUser');

        return Inertia::render('Inventory/WorkflowTemplates/Form', [
            'template'  => $workflowTemplate,
            'users'     => User::orderBy('name')->get(['id', 'name']),
            'roles'     => Role::orderBy('name')->pluck('name'),
            'urgencies' => ['LOW', 'NORMAL', 'HIGH', 'URGENT'],
        ]);
    }

    public function update(StoreWorkflowTemplateRequest $request, WorkflowTemplate $workflowTemplate): RedirectResponse
    {
        $this->authorize('update', WorkflowTemplate::class);
        $this->saveTemplate($workflowTemplate, $request->validated());

        return redirect()->route('inventory.workflow-templates.index')
            ->with(['success' => true, 'status' => "Workflow template updated."]);
    }

    public function destroy(WorkflowTemplate $workflowTemplate): RedirectResponse
    {
        $this->authorize('delete', WorkflowTemplate::class);

        if ($workflowTemplate->purchaseRequests()->exists()) {
            return back()->with(['success' => false, 'status' => 'Cannot delete: template is used by existing purchase requests.']);
        }

        $workflowTemplate->delete();

        return redirect()->route('inventory.workflow-templates.index')
            ->with(['success' => true, 'status' => 'Workflow template deleted.']);
    }

    private function saveTemplate(?WorkflowTemplate $existing, array $data): WorkflowTemplate
    {
        if ($data['is_default'] ?? false) {
            WorkflowTemplate::where('is_default', true)->update(['is_default' => false]);
        }

        $fields = [
            'name'        => $data['name'],
            'description' => $data['description'] ?? null,
            'is_active'   => $data['is_active'] ?? true,
            'is_default'  => $data['is_default'] ?? false,
            'priority'    => $data['priority'] ?? 0,
            'conditions'  => [
                'urgencies'       => $data['conditions']['urgencies']       ?? [],
                'requester_roles' => $data['conditions']['requester_roles'] ?? [],
                'min_total'       => $data['conditions']['min_total']       ?? null,
            ],
        ];

        $template = $existing
            ? tap($existing)->update($fields)
            : WorkflowTemplate::create($fields);

        // Sync steps: delete all and re-create
        $template->steps()->delete();
        foreach ($data['steps'] as $step) {
            $template->steps()->create([
                'name'              => $step['name'],
                'sort_order'        => $step['sort_order'],
                'approver_user_id'  => $step['approver_user_id'] ?? null,
                'approver_role'     => $step['approver_role'] ?? null,
            ]);
        }

        return $template;
    }
}
