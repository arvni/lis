<?php

namespace App\Domains\Laboratory\Policies;

use App\Domains\Laboratory\Models\Instruction;
use App\Domains\User\Models\User;

class InstructionPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->can("Advance Settings.Instructions.List Instructions");
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Instruction $instruction): bool
    {
        return $user->can("Advance Settings.Instructions.Create Instruction");
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->can("Advance Settings.Instructions.Create Instruction");
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Instruction $instruction): bool
    {
        return $user->can("Advance Settings.Instructions.Edit Instruction");
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Instruction $instruction): bool
    {
        return $user->can("Advance Settings.Instructions.Delete Instruction");
    }
}
