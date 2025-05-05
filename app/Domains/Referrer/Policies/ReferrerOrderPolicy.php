<?php

namespace App\Domains\Referrer\Policies;

use App\Domains\Referrer\Models\ReferrerOrder;
use App\Domains\User\Models\User;

class ReferrerOrderPolicy
{
        /**
         * Determine whether the user can view any models.
         */
        public function viewAny(User $authUser): bool
    {
        return $authUser->can("Referrer.Referrer Orders.List Referrer Orders");
    }

        /**
         * Determine whether the user can create models.
         */
        public function create(User $authUser): bool
    {
        return $authUser->can("Referrer.Referrer Orders.Create Referrer Order");
    }

        /**
         * Determine whether the user can view the model.
         */
        public function view(User $user, ReferrerOrder $referrerOrder): bool
    {
        return $user->can("Referrer.Referrer Orders.View Referrer Order");
    }

        /**
         * Determine whether the user can update the model.
         */
        public function update(User $authUser, ReferrerOrder $referrerOrder): bool
    {
        return $authUser->can("Referrer.Referrer Orders.Edit Referrer Order");
    }

        /**
         * Determine whether the user can delete the model.
         */
        public function delete(User $authUser, ReferrerOrder $referrerOrder): bool
    {
        return $authUser->can("Referrer.Referrer Orders.Delete Referrer Order");
    }
}
