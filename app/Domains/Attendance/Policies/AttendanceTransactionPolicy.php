<?php

declare(strict_types=1);

namespace App\Domains\Attendance\Policies;

use App\Domains\User\Models\User;

class AttendanceTransactionPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('Attendance.Transactions.List Transactions');
    }

    public function import(User $user): bool
    {
        return $user->can('Attendance.Transactions.Import Transactions');
    }
}
