<?php

namespace App\Domains\Consultation\Policies;

use App\Domains\Consultation\Models\Time;
use App\Domains\User\Models\User;

class TimePolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->can("Consultation.Reservations.List Reservations");
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->can("Consultation.Reservations.Create Reservation");
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Time $time): bool
    {
        return $user->can("Consultation.Reservations.View Reservation");
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Time $time): bool
    {
        return $user->can("Consultation.Reservations.Edit Reservation");
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Time $time): bool
    {
        return $user->can("Consultation.Reservations.Delete Reservation");
    }
}
