<?php

namespace App\Domains\System\Policies;

use App\Domains\User\Models\User;

class FailedJobPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('System.Failed Jobs.List Failed Jobs');
    }

    public function retry(User $user): bool
    {
        return $user->can('System.Failed Jobs.Retry Failed Job');
    }

    public function delete(User $user): bool
    {
        return $user->can('System.Failed Jobs.Delete Failed Job');
    }
}
