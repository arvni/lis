<?php

declare(strict_types=1);

namespace App\Domains\Inventory\Policies;

use App\Domains\User\Models\User;

class UnitPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('Inventory.Units.List Units');
    }

    public function create(User $user): bool
    {
        return $user->can('Inventory.Units.Create Unit');
    }

    public function update(User $user): bool
    {
        return $user->can('Inventory.Units.Edit Unit');
    }

    public function delete(User $user): bool
    {
        return $user->can('Inventory.Units.Delete Unit');
    }
}
