<?php

namespace App\Domains\Referrer\Repositories;

use App\Domains\Referrer\Models\Referrer;
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
        return Referrer::create($data);
    }

    public function updateReferrer(Referrer $referrer, array $data): Referrer
    {
        $referrer->fill($data);
        if ($referrer->isDirty())
            $referrer->save();
        return $referrer;
    }

    public function deleteReferrer(Referrer $referrer): void
    {
        $referrer->delete();
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
