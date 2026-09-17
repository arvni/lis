<?php

declare(strict_types=1);

namespace App\Domains\Payroll\Policies;

use App\Domains\Payroll\Models\SalarySlip;
use App\Domains\User\Models\User;

/**
 * Preparing a slip and releasing it are separate jobs, so a clerk can work up the month without
 * also deciding it goes out.
 *
 * Seeing your own issued slip needs no permission — that is what issuing one is for. A draft is
 * nobody's business but payroll's until it is released.
 */
class SalarySlipPolicy
{
    public function viewAny(User $user): bool
    {
        // Everyone can reach the page; it shows only their own issued slips unless they may see all.
        return true;
    }

    public function viewAll(User $user): bool
    {
        return $user->can('Payroll.Salary Slips.View All Salary Slips')
            || $user->can('Payroll.Salary Slips.Manage Salary Slips');
    }

    public function view(User $user, SalarySlip $slip): bool
    {
        if ($this->viewAll($user)) {
            return true;
        }

        return $slip->user_id === $user->id && $slip->isIssued();
    }

    public function create(User $user): bool
    {
        return $user->can('Payroll.Salary Slips.Manage Salary Slips');
    }

    public function update(User $user, SalarySlip $slip): bool
    {
        // Issued slips stay editable by permission holders, by design.
        return $user->can('Payroll.Salary Slips.Manage Salary Slips');
    }

    public function issue(User $user, SalarySlip $slip): bool
    {
        return $slip->isDraft() && $user->can('Payroll.Salary Slips.Issue Salary Slips');
    }

    public function delete(User $user, SalarySlip $slip): bool
    {
        // Once it has gone out, the employee has seen it; removing it would leave them holding a
        // document nothing corroborates.
        return $slip->isDraft() && $user->can('Payroll.Salary Slips.Manage Salary Slips');
    }
}
