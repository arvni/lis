<?php

namespace App\Domains\Laboratory\Policies;

use App\Domains\Laboratory\Models\Material;
use App\Domains\User\Models\User;

class MaterialPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->can("Advance Settings.Materials.List Materials");
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Material $material): bool
    {
        return $user->can("Advance Settings.Materials.Create Material");
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->can("Advance Settings.Materials.Create Material");
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Material $material): bool
    {
        return $user->can("Advance Settings.Materials.Edit Material");
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Material $material): bool
    {
        return $user->can("Advance Settings.Materials.Delete Material");
    }
}
