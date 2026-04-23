<?php

namespace App\Domains\Inventory\Policies;

use App\Domains\User\Models\User;

class StockTransactionPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('Inventory.Transactions.List Transactions');
    }

    public function view(User $user): bool
    {
        return $user->can('Inventory.Transactions.View Transaction');
    }

    public function create(User $user): bool
    {
        return $user->can('Inventory.Transactions.Create Transaction');
    }

    public function approve(User $user): bool
    {
        return $user->can('Inventory.Transactions.Approve Transaction');
    }

    public function cancel(User $user): bool
    {
        return $user->can('Inventory.Transactions.Cancel Transaction');
    }
}
