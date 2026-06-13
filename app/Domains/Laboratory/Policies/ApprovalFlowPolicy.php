<?php

namespace App\Domains\Laboratory\Policies;

use App\Domains\Laboratory\Models\ApprovalFlow;
use App\Domains\User\Models\User;

class ApprovalFlowPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->can("Advance Settings.Approval Flows.List Approval Flows");
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, ApprovalFlow $approvalFlow): bool
    {
        return $user->can("Advance Settings.Approval Flows.List Approval Flows");
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->can("Advance Settings.Approval Flows.Create Approval Flow");
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, ApprovalFlow $approvalFlow): bool
    {
        return $user->can("Advance Settings.Approval Flows.Edit Approval Flow");
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, ApprovalFlow $approvalFlow): bool
    {
        return $user->can("Advance Settings.Approval Flows.Delete Approval Flow");
    }
}
