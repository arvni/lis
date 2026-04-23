<?php

namespace App\Domains\Inventory\Policies;

use App\Domains\User\Models\User;

class StorePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('Inventory.Stores.List Stores');
    }

    public function view(User $user): bool
    {
        return $user->can('Inventory.Stores.View Store');
    }

    public function create(User $user): bool
    {
        return $user->can('Inventory.Stores.Create Store');
    }

    public function update(User $user): bool
    {
        return $user->can('Inventory.Stores.Edit Store');
    }

    public function delete(User $user): bool
    {
        return $user->can('Inventory.Stores.Delete Store');
    }
}
