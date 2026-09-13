<?php

declare(strict_types=1);

namespace App\Domains\Reception\Policies;

use App\Domains\Reception\Models\TatAlertRule;
use App\Domains\User\Models\User;

class TatAlertRulePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('Advance Settings.TAT Alerts.List TAT Alerts');
    }

    public function create(User $user): bool
    {
        return $user->can('Advance Settings.TAT Alerts.Create TAT Alert');
    }

    public function update(User $user, TatAlertRule $rule): bool
    {
        return $user->can('Advance Settings.TAT Alerts.Edit TAT Alert');
    }

    public function delete(User $user, TatAlertRule $rule): bool
    {
        return $user->can('Advance Settings.TAT Alerts.Delete TAT Alert');
    }
}
