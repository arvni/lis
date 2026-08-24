<?php

declare(strict_types=1);

namespace App\Domains\Billing\Services;

use App\Domains\Billing\DTOs\DiscountPartnerDTO;
use App\Domains\Billing\Models\DiscountPartner;
use App\Domains\Billing\Repositories\DiscountPartnerRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Arr;

class DiscountPartnerService
{
    public function __construct(private readonly DiscountPartnerRepository $partnerRepository) {}

    public function listPartners(array $queryData): LengthAwarePaginator
    {
        return $this->partnerRepository->listPartners($queryData);
    }

    /**
     * @return Collection<int, DiscountPartner>
     */
    public function listForSelect(?string $search): Collection
    {
        return $this->partnerRepository->listActiveForSelect($search);
    }

    public function storePartner(DiscountPartnerDTO $dto): DiscountPartner
    {
        $partner = $this->partnerRepository->createPartner($dto->toArray());
        $this->syncOffers($partner, $dto->offers);

        return $partner;
    }

    public function updatePartner(DiscountPartner $partner, DiscountPartnerDTO $dto): DiscountPartner
    {
        $updated = $this->partnerRepository->updatePartner($partner, $dto->toArray());
        $this->syncOffers($updated, $dto->offers);

        return $updated;
    }

    public function deletePartner(DiscountPartner $partner): void
    {
        $this->partnerRepository->deletePartner($partner);
    }

    /**
     * Attaching an offer here is what gives it teeth: until a partner points at it,
     * an offer row never affects a price.
     *
     * @param  list<array<string, mixed>>  $offers
     */
    public function syncOffers(DiscountPartner $partner, array $offers): void
    {
        $partner->offers()->sync(Arr::pluck($offers, 'id'));
    }
}
