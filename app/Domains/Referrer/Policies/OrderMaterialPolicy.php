<?php

namespace App\Domains\Referrer\Policies;

use App\Domains\Referrer\Models\OrderMaterial;
use App\Domains\User\Models\User;

class OrderMaterialPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->can("Referrer.Order Materials.List Order Materials");
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, OrderMaterial $orderMaterial): bool
    {
        return $user->can("Referrer.Order Materials.View Material");
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, OrderMaterial $orderMaterial): bool
    {
        return $user->can("Referrer.Order Materials.Edit Material");
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, OrderMaterial $orderMaterial): bool
    {
        return $user->can("Referrer.Order Materials.Delete Material");
    }
}
