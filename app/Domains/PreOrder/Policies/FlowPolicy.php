<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\Policies;

use App\Domains\PreOrder\Models\Flow;
use App\Domains\User\Models\User;

class FlowPolicy
{
    /** See, copy, publish and switch flows on or off. */
    public function manage(User $user, ?Flow $flow = null): bool
    {
        return $user->can('PreOrders.Flows.Manage');
    }
}
