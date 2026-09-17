<?php

declare(strict_types=1);

namespace App\Domains\Payroll\Policies;

use App\Domains\Payroll\Models\EmploymentContract;
use App\Domains\User\Models\User;

/**
 * Contracts carry salaries, so there is no self-service ability here: seeing your own contract
 * needs the same permission as seeing anyone else's.
 */
class EmploymentContractPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('Payroll.Contracts.List Contracts');
    }

    public function view(User $user, EmploymentContract $contract): bool
    {
        return $user->can('Payroll.Contracts.List Contracts');
    }

    public function create(User $user): bool
    {
        return $user->can('Payroll.Contracts.Create Contract');
    }

    public function update(User $user, EmploymentContract $contract): bool
    {
        return $user->can('Payroll.Contracts.Edit Contract');
    }

    public function delete(User $user, EmploymentContract $contract): bool
    {
        return $user->can('Payroll.Contracts.Delete Contract');
    }
}
