<?php

namespace App\Domains\Referrer\Policies;

use App\Domains\Referrer\Models\Referrer;
use App\Domains\User\Models\User;

class ReferrerPolicy
{
        /**
         * Determine whether the user can view any models.
         */
        public function viewAny(User $authUser): bool
    {
        return $authUser->can("Referrer.List Referrers");
    }

        /**
         * Determine whether the user can create models.
         */
        public function create(User $authUser): bool
    {
        return $authUser->can("Referrer.Create Referrer");
    }

        /**
         * Determine whether the user can view the model.
         */
        public function view(User $user, Referrer $referrer): bool
    {
        return $user->can("Referrer.View Referrer");
    }

        /**
         * Determine whether the user can update the model.
         */
        public function update(User $authUser, Referrer $referrer): bool
    {
        return $authUser->can("Referrer.Edit Referrer");
    }

        /**
         * Determine whether the user can delete the model.
         */
        public function delete(User $authUser, Referrer $referrer): bool
    {
        return $authUser->can("Referrer.Delete Referrer");
    }
}
