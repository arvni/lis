<?php

namespace App\Domains\Consultation\Policies;

use App\Domains\Consultation\Models\Consultant;
use App\Domains\User\Models\User;

class ConsultantPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->can("Consultation.Consultants.List Consultants");
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->can("Consultation.Consultants.Create Consultant");
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Consultant $consultant): bool
    {
        return $user->can("Consultation.Consultants.View Consultant");
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Consultant $consultant): bool
    {
        return $user->can("Consultation.Consultants.Edit Consultant");
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Consultant $consultant): bool
    {
        return $user->can("Consultation.Consultants.Delete Consultant");
    }
}
