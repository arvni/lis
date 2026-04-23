<?php

namespace App\Domains\Inventory\Policies;

use App\Domains\User\Models\User;

class PurchaseRequestPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('Inventory.PurchaseRequests.List Purchase Requests');
    }

    public function create(User $user): bool
    {
        return $user->can('Inventory.PurchaseRequests.Create Purchase Request');
    }

    public function approve(User $user): bool
    {
        return $user->can('Inventory.PurchaseRequests.Approve Purchase Request');
    }
}
