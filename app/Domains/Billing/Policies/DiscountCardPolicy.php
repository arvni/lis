<?php

declare(strict_types=1);

namespace App\Domains\Billing\Policies;

use App\Domains\Billing\Models\DiscountCard;
use App\Domains\User\Models\User;

class DiscountCardPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('Billing.Discount Cards.List Discount Cards');
    }

    public function view(User $user, DiscountCard $card): bool
    {
        return $user->can('Billing.Discount Cards.List Discount Cards');
    }

    /** Minting cards is the money-shaped action here, so it has its own permission. */
    public function issue(User $user): bool
    {
        return $user->can('Billing.Discount Cards.Issue Discount Cards');
    }

    public function update(User $user, DiscountCard $card): bool
    {
        return $user->can('Billing.Discount Cards.Edit Discount Card');
    }

    public function revoke(User $user, DiscountCard $card): bool
    {
        return $user->can('Billing.Discount Cards.Revoke Discount Card');
    }

    /** Applying a card at reception is a separate job from administering cards. */
    public function apply(User $user): bool
    {
        return $user->can('Billing.Discount Cards.Apply To Acceptance');
    }

    /** Reading what the lab gave away is a finance job, not a card-admin one. */
    public function viewUsage(User $user): bool
    {
        return $user->can('Billing.Discount Cards.View Usage Report');
    }

    public function print(User $user): bool
    {
        return $user->can('Billing.Discount Cards.Issue Discount Cards');
    }

    /**
     * Handing stock to a partner is what gives a card its discount, so it is
     * gated like minting rather than like editing one card.
     */
    public function assign(User $user): bool
    {
        return $user->can('Billing.Discount Cards.Assign Discount Cards');
    }
}
