<?php

namespace App\Domains\Referrer\Policies;

use App\Domains\Referrer\Models\Material;
use App\Domains\User\Models\User;

class MaterialPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->can("Referrer.Materials.List Materials");
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Material $material): bool
    {
        return $user->can("Referrer.Materials.Create Material");
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->can("Referrer.Materials.Create Material");
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Material $material): bool
    {
        return $user->can("Referrer.Materials.Edit Material");
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Material $material): bool
    {
        return $user->can("Referrer.Materials.Delete Material");
    }
}
