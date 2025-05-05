<?php

namespace App\Domains\Laboratory\Policies;

use App\Domains\Laboratory\Models\BarcodeGroup;
use App\Domains\User\Models\User;

class BarcodeGroupPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->can("Advance Settings.Barcode Groups.List Barcode Groups");
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, BarcodeGroup $barcodeGroup): bool
    {
        return $user->can("Advance Settings.Barcode Groups.Create Barcode Group");
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->can("Advance Settings.Barcode Groups.Create Barcode Group");
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, BarcodeGroup $barcodeGroup): bool
    {
        return $user->can("Advance Settings.Barcode Groups.Edit Barcode Group");
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, BarcodeGroup $barcodeGroup): bool
    {
        return $user->can("Advance Settings.Barcode Groups.Delete Barcode Group");
    }
}
