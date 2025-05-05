<?php

namespace App\Domains\Laboratory\Policies;

use App\Domains\Laboratory\Models\Test;
use App\Domains\User\Models\User;

class TestPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->can("Advance Settings.Tests.List Tests");
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Test $test): bool
    {
        return $user->can("Advance Settings.Tests.Create Test");
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->can("Advance Settings.Tests.Create Test");
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Test $test): bool
    {
        return $user->can("Advance Settings.Tests.Edit Test");
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Test $test): bool
    {
        return $user->can("Advance Settings.Tests.Delete Test");
    }
}
