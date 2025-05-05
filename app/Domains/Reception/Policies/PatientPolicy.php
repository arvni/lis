<?php

namespace App\Domains\Reception\Policies;

use App\Domains\Reception\Models\Patient;
use App\Domains\User\Models\User;

class PatientPolicy
{
        /**
         * Determine whether the user can view any models.
         */
        public function viewAny(User $authUser): bool
    {
        return $authUser->can("Reception.Patients.List Patients");
    }

        /**
         * Determine whether the user can create models.
         */
        public function create(User $authUser): bool
    {
        return $authUser->can("Reception.Patients.Create Patient");
    }

        /**
         * Determine whether the user can view the model.
         */
        public function view(User $user, Patient $patient): bool
    {
        return $user->can("Reception.Patients.View Patient");
    }

        /**
         * Determine whether the user can update the model.
         */
        public function update(User $authUser, Patient $patient): bool
    {
        return $authUser->can("Reception.Patients.Edit Patient");
    }

        /**
         * Determine whether the user can delete the model.
         */
        public function delete(User $authUser, Patient $patient): bool
    {
        return $authUser->can("Reception.Patients.Delete Patient");
    }
}
