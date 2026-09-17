<?php

declare(strict_types=1);

namespace App\Domains\Payroll\Policies;

use App\Domains\Payroll\Models\PayrollItemType;
use App\Domains\User\Models\User;

class PayrollItemTypePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('Payroll.Item Types.List Item Types');
    }

    public function create(User $user): bool
    {
        return $user->can('Payroll.Item Types.Manage Item Types');
    }

    public function update(User $user, PayrollItemType $type): bool
    {
        return $user->can('Payroll.Item Types.Manage Item Types');
    }

    public function delete(User $user, PayrollItemType $type): bool
    {
        return $user->can('Payroll.Item Types.Manage Item Types');
    }
}
