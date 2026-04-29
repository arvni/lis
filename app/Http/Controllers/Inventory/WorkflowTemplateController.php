<?php

namespace App\Http\Controllers\Inventory;

use App\Domains\Inventory\Models\WorkflowTemplate;
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

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', WorkflowTemplate::class);

        $data = $request->validate([
            'name'                            => 'required|string|max:255',
            'description'                     => 'nullable|string',
            'is_active'                       => 'boolean',
            'is_default'                      => 'boolean',
            'priority'                        => 'integer|min:0',
            'conditions'                      => 'nullable|array',
            'conditions.urgencies'            => 'nullable|array',
            'conditions.urgencies.*'          => 'string',
            'conditions.requester_roles'      => 'nullable|array',
            'conditions.requester_roles.*'    => 'string',
            'conditions.min_total'            => 'nullable|numeric|min:0',
            'steps'                           => 'present|array',
            'steps.*.name'                    => 'required|string|max:255',
            'steps.*.sort_order'              => 'required|integer|min:0',
            'steps.*.approver_user_id'        => 'nullable|exists:users,id',
            'steps.*.approver_role'           => 'nullable|string',
        ]);

        $template = $this->saveTemplate(null, $data);

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

    public function update(Request $request, WorkflowTemplate $workflowTemplate): RedirectResponse
    {
        $this->authorize('update', WorkflowTemplate::class);

        $data = $request->validate([
            'name'                            => 'required|string|max:255',
            'description'                     => 'nullable|string',
            'is_active'                       => 'boolean',
            'is_default'                      => 'boolean',
            'priority'                        => 'integer|min:0',
            'conditions'                      => 'nullable|array',
            'conditions.urgencies'            => 'nullable|array',
            'conditions.urgencies.*'          => 'string',
            'conditions.requester_roles'      => 'nullable|array',
            'conditions.requester_roles.*'    => 'string',
            'conditions.min_total'            => 'nullable|numeric|min:0',
            'steps'                           => 'present|array',
            'steps.*.name'                    => 'required|string|max:255',
            'steps.*.sort_order'              => 'required|integer|min:0',
            'steps.*.approver_user_id'        => 'nullable|exists:users,id',
            'steps.*.approver_role'           => 'nullable|string',
        ]);

        $this->saveTemplate($workflowTemplate, $data);

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
