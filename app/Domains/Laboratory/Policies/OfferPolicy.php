<?php

namespace App\Domains\Laboratory\Policies;

use App\Domains\Laboratory\Models\Offer;
use App\Domains\User\Models\User;

class OfferPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->can("Advance Settings.Offers.List Offers");
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Offer $offer): bool
    {
        return $user->can("Advance Settings.Offers.Create Offer");
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->can("Advance Settings.Offers.Create Offer");
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Offer $offer): bool
    {
        return $user->can("Advance Settings.Offers.Edit Offer");
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Offer $offer): bool
    {
        return $user->can("Advance Settings.Offers.Delete Offer");
    }
}
