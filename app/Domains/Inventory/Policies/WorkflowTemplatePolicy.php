<?php

namespace App\Domains\Inventory\Policies;

use App\Domains\User\Models\User;

class WorkflowTemplatePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('Inventory.WorkflowTemplates.List Workflow Templates');
    }

    public function create(User $user): bool
    {
        return $user->can('Inventory.WorkflowTemplates.Manage Workflow Templates');
    }

    public function update(User $user): bool
    {
        return $user->can('Inventory.WorkflowTemplates.Manage Workflow Templates');
    }

    public function delete(User $user): bool
    {
        return $user->can('Inventory.WorkflowTemplates.Manage Workflow Templates');
    }
}
