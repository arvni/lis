<?php

namespace App\Domains\Inventory\Policies;

use App\Domains\User\Models\User;

class SupplierPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('Inventory.Suppliers.List Suppliers');
    }

    public function view(User $user): bool
    {
        return $user->can('Inventory.Suppliers.View Supplier');
    }

    public function create(User $user): bool
    {
        return $user->can('Inventory.Suppliers.Create Supplier');
    }

    public function update(User $user): bool
    {
        return $user->can('Inventory.Suppliers.Edit Supplier');
    }

    public function delete(User $user): bool
    {
        return $user->can('Inventory.Suppliers.Delete Supplier');
    }
}
