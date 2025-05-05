<?php

namespace App\Domains\Laboratory\Policies;

use App\Domains\Laboratory\Models\Workflow;
use App\Domains\User\Models\User;

class WorkflowPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->can("Advance Settings.Workflows.List Workflows");
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Workflow $workflow): bool
    {
        return $user->can("Advance Settings.Workflows.Create Workflow");
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->can("Advance Settings.Workflows.Create Workflow");
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Workflow $workflow): bool
    {
        return $user->can("Advance Settings.Workflows.Edit Workflow");
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Workflow $workflow): bool
    {
        return $user->can("Advance Settings.Workflows.Delete Workflow");
    }
}
