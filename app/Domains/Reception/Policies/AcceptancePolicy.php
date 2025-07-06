<?php

namespace App\Domains\Reception\Policies;

use App\Domains\Reception\Enums\AcceptanceStatus;
use App\Domains\Reception\Models\Acceptance;
use App\Domains\User\Models\User;

class AcceptancePolicy
{
        /**
         * Determine whether the user can view any models.
         */
        public function viewAny(User $authUser): bool
    {
        return $authUser->can("Reception.Acceptances.List Acceptances");
    }

        /**
         * Determine whether the user can create models.
         */
        public function create(User $authUser): bool
    {
        return $authUser->can("Reception.Acceptances.Create Acceptance");
    }

        /**
         * Determine whether the user can view the model.
         */
        public function view(User $user): bool
    {
        return $user->can("Reception.Acceptances.View Acceptance");
    }

        /**
         * Determine whether the user can update the model.
         */
        public function update(User $authUser,Acceptance $acceptance): bool
    {
        return $authUser->can("Reception.Acceptances.Edit Acceptance") || $acceptance?->status == AcceptanceStatus::PENDING;
    }

        /**
         * Determine whether the user can update the model.
         */
        public function cancel(User $authUser): bool
    {
        return $authUser->can("Reception.Acceptances.Cancel Acceptance");
    }

        /**
         * Determine whether the user can delete the model.
         */
        public function delete(User $authUser): bool
    {
        return $authUser->can("Reception.Acceptances.Delete Acceptance");
    }

    public function sampleCollection(User $authUser): bool
    {
        return $authUser->can("Sample Collection");
    }
}
