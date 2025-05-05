<?php

namespace App\Domains\Laboratory\Policies;

use App\Domains\Laboratory\Models\SampleType;
use App\Domains\User\Models\User;

class SampleTypePolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->can("Advance Settings.Sample Types.List Sample Types");
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, SampleType $sampleType): bool
    {
        return $user->can("Advance Settings.Sample Types.Create Sample Type");
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->can("Advance Settings.Sample Types.Create Sample Type");
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, SampleType $sampleType): bool
    {
        return $user->can("Advance Settings.Sample Types.Edit Sample Type");
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, SampleType $sampleType): bool
    {
        return $user->can("Advance Settings.Sample Types.Delete Sample Type");
    }
}
