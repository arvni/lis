<?php

namespace App\Domains\Referrer\Repositories;

use App\Domains\Referrer\Models\ReferrerOrder;
use Illuminate\Pagination\LengthAwarePaginator;
use Ramsey\Collection\Collection;

class ReferrerOrderRepository
{
    public function listReferrerOrder(array $queryData): LengthAwarePaginator
    {
        $query = ReferrerOrder::query()->with([ "referrer","patient","user"]);
        if (isset($queryData["filters"])) {
            $this->applyFilters($query, $queryData["filters"]);
        }
        $query->orderBy($queryData['sort']['field'] ?? 'id', $queryData['sort']['sort'] ?? 'asc');
        return $query->paginate($queryData["pageSize"]);
    }

    public function createReferrerOrder(array $data): ReferrerOrder
    {
        return ReferrerOrder::create($data);
    }

    public function updateReferrerOrder(ReferrerOrder $referrer, array $data): ReferrerOrder
    {
        $referrer->fill($data);
        if ($referrer->isDirty())
            $referrer->save();
        return $referrer;
    }

    public function deleteReferrerOrder(ReferrerOrder $referrer): void
    {
        $referrer->delete();
    }


    public function findReferrerOrderById($id): ?ReferrerOrder
    {
        return ReferrerOrder::find($id);
    }

    public function findReferrerOrderByEmail($email): ?ReferrerOrder
    {
        return ReferrerOrder::where("email", $email)->first();
    }

    public function applyFilters($query, array $filters)
    {
        if (isset($filters["search"])) {
            $query->search($filters["search"]);
        }
    }
}
