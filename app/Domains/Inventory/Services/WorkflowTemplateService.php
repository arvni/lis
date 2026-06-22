<?php

namespace App\Domains\Inventory\Services;

use App\Domains\Inventory\Models\WorkflowTemplate;
use App\Domains\Inventory\Repositories\WorkflowTemplateRepository;
use App\Domains\User\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Spatie\Permission\Models\Role;

class WorkflowTemplateService
{
    private const URGENCIES = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];

    public function __construct(private WorkflowTemplateRepository $repository) {}

    /**
     * @return Collection<int, WorkflowTemplate>
     */
    public function listTemplates(): Collection
    {
        return $this->repository->listWithStepsAndUsage();
    }

    /**
     * Reference data for the create/edit form (approver users, roles, urgencies).
     *
     * @return array<string, mixed>
     */
    public function formReferenceData(): array
    {
        return [
            'users' => User::orderBy('name')->get(['id', 'name']),
            'roles' => Role::orderBy('name')->pluck('name'),
            'urgencies' => self::URGENCIES,
        ];
    }

    /**
     * Create or update a template (and its steps) from validated form data.
     */
    public function save(?WorkflowTemplate $existing, array $data): WorkflowTemplate
    {
        if ($data['is_default'] ?? false) {
            $this->repository->clearDefaultFlag();
        }

        $fields = [
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'is_active' => $data['is_active'] ?? true,
            'is_default' => $data['is_default'] ?? false,
            'priority' => $data['priority'] ?? 0,
            'conditions' => [
                'urgencies' => $data['conditions']['urgencies'] ?? [],
                'requester_roles' => $data['conditions']['requester_roles'] ?? [],
                'min_total' => $data['conditions']['min_total'] ?? null,
            ],
        ];

        $template = $existing
            ? $this->repository->update($existing, $fields)
            : $this->repository->create($fields);

        $this->repository->syncSteps($template, $data['steps']);

        return $template;
    }

    /**
     * Delete a template unless it is referenced by existing purchase requests.
     * Returns false (without deleting) when the template is still in use.
     */
    public function deleteIfUnused(WorkflowTemplate $template): bool
    {
        if ($this->repository->hasPurchaseRequests($template)) {
            return false;
        }

        $this->repository->delete($template);

        return true;
    }
}
