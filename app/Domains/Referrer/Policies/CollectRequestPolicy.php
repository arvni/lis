<?php

namespace App\Domains\Referrer\Policies;

use App\Domains\Referrer\Models\CollectRequest;
use App\Domains\User\Models\User;

class CollectRequestPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $authUser): bool
    {
        return $authUser->can("Referrer.List Collect Requests");
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $authUser): bool
    {
        return $authUser->can("Referrer.Create Collect Request");
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, CollectRequest $collectRequest): bool
    {
        return $user->can("Referrer.View Collect Request");
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $authUser, CollectRequest $collectRequest): bool
    {
        return $authUser->can("Referrer.Edit Collect Request");
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $authUser, CollectRequest $collectRequest): bool
    {
        return $authUser->can("Referrer.Delete Collect Request");
    }
}
