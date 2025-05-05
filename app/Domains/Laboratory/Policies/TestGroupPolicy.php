<?php

namespace App\Domains\Laboratory\Policies;

use App\Domains\Laboratory\Models\TestGroup;
use App\Domains\User\Models\User;

class TestGroupPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->can("Advance Settings.Test Groups.List Test Groups");
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, TestGroup $testGroup): bool
    {
        return $user->can("Advance Settings.Test Groups.Create Test Group");
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->can("Advance Settings.Test Groups.Create Test Group");
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, TestGroup $testGroup): bool
    {
        return $user->can("Advance Settings.Test Groups.Edit Test Group");
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, TestGroup $testGroup): bool
    {
        return $user->can("Advance Settings.Test Groups.Delete Test Group");
    }
}
