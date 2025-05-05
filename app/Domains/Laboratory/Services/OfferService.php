<?php

namespace App\Domains\Laboratory\Services;


use App\Domains\Laboratory\DTOs\OfferDTO;
use App\Domains\Laboratory\Models\Offer;
use App\Domains\Laboratory\Repositories\OfferRepository;
use Exception;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Arr;

class OfferService
{
    public function __construct(private OfferRepository $offerRepository)
    {
    }

    public function listOffers($queryData): LengthAwarePaginator
    {
        return $this->offerRepository->ListOffers($queryData);
    }

    public function storeOffer(OfferDTO $offerDTO): Offer
    {
        $offer = $this->offerRepository->creatOffer($offerDTO->toArray());
        $this->syncTests($offer, $offerDTO->tests);
        $this->syncReferrers($offer, $offerDTO->referrers);
        return $offer;
    }

    public function updateOffer(Offer $offer, OfferDTO $offerDTO): Offer
    {
        $updatedOffer = $this->offerRepository->updateOffer($offer, $offerDTO->toArray());
        $this->syncTests($updatedOffer, $offerDTO->tests);
        $this->syncReferrers($updatedOffer, $offerDTO->referrers);
        return $updatedOffer;
    }

    /**
     * @throws Exception
     */
    public function deleteOffer(Offer $offer): void
    {
        $this->offerRepository->deleteOffer($offer);
    }

    public function syncTests(Offer $offer, array $tests): void
    {
        $offer->tests()->sync(Arr::pluck($tests, "id"));
    }

    public function syncReferrers(Offer $offer, array $referrers): void
    {
        $offer->referrers()->sync(Arr::pluck($referrers, "id"));
    }

}
