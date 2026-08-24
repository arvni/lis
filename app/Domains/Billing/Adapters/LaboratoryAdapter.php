<?php

declare(strict_types=1);

namespace App\Domains\Billing\Adapters;

use App\Domains\Laboratory\Models\Offer;
use App\Domains\Laboratory\Repositories\OfferRepository;
use Illuminate\Support\Collection;

/**
 * Adapter that translates between Billing and Laboratory domains.
 *
 * Discount rules live in Laboratory as offers; Billing reads them through here
 * rather than reaching into that domain's repositories directly.
 */
class LaboratoryAdapter
{
    public function __construct(private readonly OfferRepository $offerRepository) {}

    /**
     * Active offers that may be attached to a partner contract. Only offers flagged
     * `contract_only` qualify — a self-serve offer is one reception already applies
     * to every patient, so contracting it would discount the same item twice over.
     *
     * @return Collection<int, Offer>
     */
    public function listContractableOffers(?string $search): Collection
    {
        $offers = $this->offerRepository->listOffers([
            'filters' => array_filter([
                'search' => $search,
                'active' => true,
                'contract_only' => true,
            ], static fn ($value) => $value !== null),
            'pageSize' => 25,
        ]);

        return collect($offers->items());
    }
}
