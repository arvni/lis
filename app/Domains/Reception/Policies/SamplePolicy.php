<?php

namespace App\Domains\Reception\Policies;

use App\Domains\User\Models\User;

class SamplePolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $authUser): bool
    {
        return $authUser->can("Sample Collection.Samples.List Samples");
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $authUser): bool
    {
        return $authUser->can("Sample Collection.Samples.Create Sample");
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user): bool
    {
        return $user->can("Sample Collection.Samples.View Sample");
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $authUser): bool
    {
        return $authUser->can("Sample Collection.Samples.Edit Sample");
    }

    /**
     * Determine whether the user can update the model.
     */
    public function cancel(User $authUser): bool
    {
        return $authUser->can("Sample Collection.Samples.Cancel Sample");
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $authUser): bool
    {
        return $authUser->can("Sample Collection.Samples.Delete Sample");
    }
}
