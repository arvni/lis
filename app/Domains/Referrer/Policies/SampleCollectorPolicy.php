<?php

namespace App\Domains\Referrer\Policies;

use App\Domains\Referrer\Models\SampleCollector;
use App\Domains\User\Models\User;

class SampleCollectorPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $authUser): bool
    {
        return $authUser->can("Referrer.List Sample Collectors");
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $authUser): bool
    {
        return $authUser->can("Referrer.Create Sample Collector");
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, SampleCollector $sampleCollector): bool
    {
        return $user->can("Referrer.View Sample Collector");
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $authUser, SampleCollector $sampleCollector): bool
    {
        return $authUser->can("Referrer.Edit Sample Collector");
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $authUser, SampleCollector $sampleCollector): bool
    {
        return $authUser->can("Referrer.Delete Sample Collector");
    }
}
