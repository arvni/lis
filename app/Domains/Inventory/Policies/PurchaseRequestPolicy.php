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

    /**
     * Granular separation-of-duties abilities for the post-approval financial lifecycle.
     * Previously order/pay/ship all gated on `create`; splitting them lets a role create a
     * request without being able to confirm the order, record payment, or mark shipment.
     */
    public function order(User $user): bool
    {
        return $user->can('Inventory.PurchaseRequests.Order Purchase Request');
    }

    public function pay(User $user): bool
    {
        return $user->can('Inventory.PurchaseRequests.Pay Purchase Request');
    }

    public function ship(User $user): bool
    {
        return $user->can('Inventory.PurchaseRequests.Ship Purchase Request');
    }
}
