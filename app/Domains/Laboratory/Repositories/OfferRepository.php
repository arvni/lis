<?php

namespace App\Domains\Laboratory\Repositories;

use App\Domains\Laboratory\Models\Offer;
use App\Domains\User\Enums\ActivityType;
use App\Domains\User\Services\UserActivityService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class OfferRepository
{

    public function listOffers(array $queryData): LengthAwarePaginator
    {
        $query = Offer::query()->with(["tests:name,id", "referrers:fullName,id"]);
        if (isset($queryData["filters"]))
            $this->applyFilters($query, $queryData["filters"]);
        if (isset($queryData["sort"]))
            $query->orderBy($queryData['sort']['field'] ?? 'id', $queryData['sort']['sort'] ?? 'asc');
        return $query->paginate($queryData["pageSize"] ?? 10);
    }

    public function creatOffer(array $offerData): Offer
    {
        $offer = Offer::query()->make($offerData);
        $offer->save();
        UserActivityService::createUserActivity($offer,ActivityType::CREATE);
        return $offer;
    }

    public function updateOffer(Offer $offer, array $offerData): Offer
    {
        $offer->fill($offerData);
        if ($offer->isDirty()) {
            $offer->save();
            UserActivityService::createUserActivity($offer,ActivityType::UPDATE);
        }
        return $offer;
    }

    public function deleteOffer(Offer $offer): void
    {
        $offer->delete();
        UserActivityService::createUserActivity($offer,ActivityType::DELETE);
    }

    protected function applyFilters($query, array $filters)
    {
        if (isset($filters["search"]))
            $query->search(["name"], $filters["search"]);
        if (isset($filters["test_id"]))
            $query->whereHas("tests", function ($query) use ($filters) {
                $query->where("tests.id", $filters["test_id"]);
            });
        if (isset($filters["referrer_id"]))
            $query->whereHas("referrer_id", function ($query) use ($filters) {
                $query->where("referrers.id", $filters["referrer_id"]);
            });
        if (isset($filters["date"]))
            $query->whereDate("started_at", "<=", $filters["date"])
                ->whereDate("ended_at", "<=", $filters["date"]);
        if (isset($filters["active"]))
            $query->where("active", $filters["active"]);
    }

}
