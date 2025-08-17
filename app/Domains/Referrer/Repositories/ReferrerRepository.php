<?php

namespace App\Domains\Referrer\Repositories;

use App\Domains\Referrer\Models\Referrer;
use App\Domains\User\Enums\ActivityType;
use App\Domains\User\Services\UserActivityService;
use Illuminate\Pagination\LengthAwarePaginator;
use Ramsey\Collection\Collection;

class ReferrerRepository
{
    public function listReferrer(array $queryData): LengthAwarePaginator
    {
        $query = Referrer::query()->withCount(["acceptances", "referrerOrders"])
            ->withSum("payments", "price");
        if (isset($queryData["filters"])) {
            $this->applyFilters($query, $queryData["filters"]);
        }
        $query->orderBy($queryData['sort']['field'] ?? 'id', $queryData['sort']['sort'] ?? 'asc');
        return $query->paginate($queryData["pageSize"]);
    }

    public function createReferrer(array $data): Referrer
    {
        $referrer= Referrer::create($data);
        UserActivityService::createUserActivity($referrer,ActivityType::CREATE);
        return $referrer;
    }

    public function updateReferrer(Referrer $referrer, array $data): Referrer
    {
        $referrer->fill($data);
        if ($referrer->isDirty()) {
            $referrer->save();
            UserActivityService::createUserActivity($referrer,ActivityType::UPDATE);
        }
        return $referrer;
    }

    public function deleteReferrer(Referrer $referrer): void
    {
        $referrer->delete();
        UserActivityService::createUserActivity($referrer,ActivityType::DELETE);
    }


    public function findReferrerById($id): ?Referrer
    {
        return Referrer::find($id);
    }

    public function findReferrerByEmail($email): ?Referrer
    {
        return Referrer::where("email", $email)->first();
    }

    public function applyFilters($query, array $filters)
    {
        if (isset($filters["search"])) {
            $query->search($filters["search"]);
        }
    }
}
