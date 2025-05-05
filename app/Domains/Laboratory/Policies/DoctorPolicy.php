<?php

namespace App\Domains\Laboratory\Policies;

use App\Domains\Laboratory\Models\Doctor;
use App\Domains\User\Models\User;

class DoctorPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->can("Advance Settings.Doctors.List Doctors");
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Doctor $doctor): bool
    {
        return $user->can("Advance Settings.Doctors.Create Doctor");
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->can("Advance Settings.Doctors.Create Doctor");
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Doctor $doctor): bool
    {
        return $user->can("Advance Settings.Doctors.Edit Doctor");
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Doctor $doctor): bool
    {
        return $user->can("Advance Settings.Doctors.Delete Doctor");
    }
}
