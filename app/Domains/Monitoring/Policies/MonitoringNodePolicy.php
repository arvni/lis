<?php

namespace App\Domains\Monitoring\Policies;

use App\Domains\User\Models\User;

class MonitoringNodePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('Monitoring.Nodes.List Nodes');
    }

    public function view(User $user): bool
    {
        return $user->can('Monitoring.Nodes.View Node');
    }

    public function update(User $user): bool
    {
        return $user->can('Monitoring.Nodes.Update Node');
    }
}
