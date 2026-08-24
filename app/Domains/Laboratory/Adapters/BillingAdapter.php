<?php

declare(strict_types=1);

namespace App\Domains\Laboratory\Adapters;

use App\Domains\Billing\Repositories\DiscountPartnerRepository;

/**
 * Adapter that translates between Laboratory and Billing domains.
 *
 * Offers live here, but partner contracts that consume them live in Billing;
 * this is how Laboratory asks whether an offer is spoken for.
 */
class BillingAdapter
{
    public function __construct(private readonly DiscountPartnerRepository $partnerRepository) {}

    public function offerIsContracted(int $offerId): bool
    {
        return $this->partnerRepository->offerIsContracted($offerId);
    }
}
