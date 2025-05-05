<?php

namespace App\Domains\Setting\Policies;

use App\Domains\Setting\Models\Setting;
use App\Domains\User\Models\User;

class SettingPolicy
{
        /**
         * Determine whether the user can view any models.
         */
        public function viewAny(User $authUser): bool
    {
        return $authUser->can("Advance Settings.Settings.List Settings");
    }

        /**
         * Determine whether the user can view the model.
         */
        public function view(User $user, Setting $setting): bool
    {
        return $user->can("Advance Settings.Settings.View Setting");
    }

        /**
         * Determine whether the user can update the model.
         */
        public function update(User $authUser, Setting $setting): bool
    {
        return $authUser->can("Advance Settings.Settings.Edit Setting");
    }


}
