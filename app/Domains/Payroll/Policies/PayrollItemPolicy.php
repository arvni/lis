<?php

declare(strict_types=1);

namespace App\Domains\Payroll\Policies;

use App\Domains\Payroll\Models\PayrollItem;
use App\Domains\User\Models\User;

/**
 * These carry what people are paid and what they owe, so there is no self-service ability here:
 * seeing your own items needs the same permission as seeing anyone else's.
 */
class PayrollItemPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('Payroll.Staff Allowances.List Staff Allowances');
    }

    public function create(User $user): bool
    {
        return $user->can('Payroll.Staff Allowances.Manage Staff Allowances');
    }

    public function update(User $user, PayrollItem $item): bool
    {
        return $user->can('Payroll.Staff Allowances.Manage Staff Allowances');
    }

    public function delete(User $user, PayrollItem $item): bool
    {
        return $user->can('Payroll.Staff Allowances.Manage Staff Allowances');
    }
}
