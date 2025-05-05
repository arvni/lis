<?php

namespace App\Domains\Consultation\Policies;

use App\Domains\Consultation\Models\Consultation;
use App\Domains\User\Models\User;

class ConsultationPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function waiting(User $authUser): bool
    {
        return $authUser->can("Consultation.Waiting List Consultations");
    }

    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $authUser): bool
    {
        return $authUser->can("Consultation.List Consultations");
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $authUser): bool
    {
        return $authUser->can("Consultation.Create Consultation");
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Consultation $consultation): bool
    {
        return $user->can("Consultation.View Consultation");
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $authUser, Consultation $consultation): bool
    {
        return $authUser->can("Consultation.Edit Consultation");
    }

    /**
     * Determine whether the user can update the model.
     */
    public function done(User $authUser, Consultation $consultation): bool
    {
        return $authUser->can("Consultation.Done Consultation");
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $authUser, Consultation $consultation): bool
    {
        return $authUser->can("Consultation.Delete Consultation");
    }
}
