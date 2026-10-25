<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\Policies;

use App\Domains\PreOrder\Models\PreOrder;
use App\Domains\User\Models\User;

class PreOrderPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('PreOrders.Cases.List');
    }

    public function view(User $user, PreOrder $preOrder): bool
    {
        return $user->can('PreOrders.Cases.View');
    }

    /** Take or reassign the case, choose the tests and main test, raise requests, write notes. */
    public function review(User $user, PreOrder $preOrder): bool
    {
        return $user->can('PreOrders.Cases.Review');
    }

    /** Give discounts, price lines the catalogue can't, run the optional BION check, see the finance desk. */
    public function quote(User $user, ?PreOrder $preOrder = null): bool
    {
        return $user->can('PreOrders.Finance.Quote');
    }

    /** Check the sample list once the batches are closed and start testing. */
    public function startTesting(User $user, PreOrder $preOrder): bool
    {
        return $user->can('PreOrders.Cases.Start Testing');
    }

    /** Cancel after samples arrived, and other moves outside the normal rules. */
    public function override(User $user, PreOrder $preOrder): bool
    {
        return $user->can('PreOrders.Cases.Override');
    }
}
