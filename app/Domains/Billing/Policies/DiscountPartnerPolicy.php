<?php

declare(strict_types=1);

namespace App\Domains\Billing\Policies;

use App\Domains\Billing\Models\DiscountPartner;
use App\Domains\User\Models\User;

class DiscountPartnerPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('Billing.Discount Partners.List Discount Partners');
    }

    public function view(User $user, DiscountPartner $partner): bool
    {
        return $user->can('Billing.Discount Partners.View Discount Partner');
    }

    public function create(User $user): bool
    {
        return $user->can('Billing.Discount Partners.Create Discount Partner');
    }

    public function update(User $user, DiscountPartner $partner): bool
    {
        return $user->can('Billing.Discount Partners.Edit Discount Partner');
    }

    public function delete(User $user, DiscountPartner $partner): bool
    {
        return $user->can('Billing.Discount Partners.Delete Discount Partner');
    }
}
