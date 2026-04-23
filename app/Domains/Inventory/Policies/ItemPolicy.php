<?php

namespace App\Domains\Inventory\Policies;

use App\Domains\User\Models\User;

class ItemPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('Inventory.Items.List Items');
    }

    public function view(User $user): bool
    {
        return $user->can('Inventory.Items.View Item');
    }

    public function create(User $user): bool
    {
        return $user->can('Inventory.Items.Create Item');
    }

    public function update(User $user): bool
    {
        return $user->can('Inventory.Items.Edit Item');
    }

    public function delete(User $user): bool
    {
        return $user->can('Inventory.Items.Delete Item');
    }
}
