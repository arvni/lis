<?php

namespace App\Domains\Billing\Policies;

use App\Domains\User\Models\User;

class StatementPolicy
{
        /**
         * Determine whether the user can view any models.
         */
        public function viewAny(User $authUser): bool
    {
        return $authUser->can("Billing.Statements.List Statements");
    }

        /**
         * Determine whether the user can create models.
         */
        public function create(User $authUser): bool
    {
        return $authUser->can("Billing.Statements.Create Statement");
    }

        /**
         * Determine whether the user can view the model.
         */
        public function view(User $user): bool
    {
        return $user->can("Billing.Statements.View Statement");
    }

        /**
         * Determine whether the user can update the model.
         */
        public function update(User $authUser): bool
    {
        return $authUser->can("Billing.Statements.Edit Statement");
    }

        /**
         * Determine whether the user can delete the model.
         */
        public function delete(User $authUser): bool
    {
        return $authUser->can("Billing.Statements.Delete Statement");
    }
}
