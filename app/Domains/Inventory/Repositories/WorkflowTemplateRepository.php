<?php

namespace App\Domains\Inventory\Repositories;

use App\Domains\Inventory\Models\WorkflowTemplate;
use Illuminate\Database\Eloquent\Collection;

class WorkflowTemplateRepository
{
    /**
     * All templates with their steps (+ approver) and a usage count, by name.
     *
     * @return Collection<int, WorkflowTemplate>
     */
    public function listWithStepsAndUsage(): Collection
    {
        return WorkflowTemplate::with('steps.approverUser')
            ->withCount('purchaseRequests')
            ->orderBy('name')
            ->get();
    }

    /**
     * Clear the default flag on every template (used before marking a new one).
     */
    public function clearDefaultFlag(): void
    {
        WorkflowTemplate::where('is_default', true)->update(['is_default' => false]);
    }

    public function create(array $fields): WorkflowTemplate
    {
        return WorkflowTemplate::create($fields);
    }

    public function update(WorkflowTemplate $template, array $fields): WorkflowTemplate
    {
        $template->update($fields);

        return $template;
    }

    /**
     * Replace a template's steps with the given set.
     *
     * @param  array<int, array<string, mixed>>  $steps
     */
    public function syncSteps(WorkflowTemplate $template, array $steps): void
    {
        $template->steps()->delete();
        foreach ($steps as $step) {
            $template->steps()->create([
                'name' => $step['name'],
                'sort_order' => $step['sort_order'],
                'approver_user_id' => $step['approver_user_id'] ?? null,
                'approver_role' => $step['approver_role'] ?? null,
            ]);
        }
    }

    public function hasPurchaseRequests(WorkflowTemplate $template): bool
    {
        return $template->purchaseRequests()->exists();
    }

    public function delete(WorkflowTemplate $template): void
    {
        $template->delete();
    }
}
