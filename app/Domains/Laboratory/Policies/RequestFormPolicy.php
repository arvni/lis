<?php

namespace App\Domains\Laboratory\Policies;

use App\Domains\Laboratory\Models\RequestForm;
use App\Domains\User\Models\User;

class RequestFormPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->can("Advance Settings.Request Forms.List Request Forms");
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, RequestForm $requestForm): bool
    {
        return $user->can("Advance Settings.Request Forms.Create Request Form");
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->can("Advance Settings.Request Forms.Create Request Form");
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, RequestForm $requestForm): bool
    {
        return $user->can("Advance Settings.Request Forms.Edit Request Form");
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, RequestForm $requestForm): bool
    {
        return $user->can("Advance Settings.Request Forms.Delete Request Form");
    }
}
