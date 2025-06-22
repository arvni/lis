<?php

namespace App\Domains\Laboratory\Policies;

use App\Domains\Laboratory\Models\ConsentForm;
use App\Domains\User\Models\User;

class ConsentFormPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->can("Advance Settings.Consent Forms.List Consent Forms");
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, ConsentForm $consentForm): bool
    {
        return $user->can("Advance Settings.Consent Forms.Create Consent Form");
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->can("Advance Settings.Consent Forms.Create Consent Form");
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, ConsentForm $consentForm): bool
    {
        return $user->can("Advance Settings.Consent Forms.Edit Consent Form");
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, ConsentForm $consentForm): bool
    {
        return $user->can("Advance Settings.Consent Forms.Delete Consent Form");
    }
}
