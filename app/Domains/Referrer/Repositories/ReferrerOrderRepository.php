<?php

namespace App\Domains\Referrer\Repositories;

use Illuminate\Database\Eloquent\Builder;

use App\Domains\Shared\Traits\LogsUserActivity;
use App\Domains\Referrer\Models\ReferrerOrder;
use Illuminate\Pagination\LengthAwarePaginator;
use Ramsey\Collection\Collection;

class ReferrerOrderRepository
{
    use LogsUserActivity;

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
        if ($referrer->isDirty()) {
            $referrer->save();
            $this->logUpdated($referrer);
        }
        return $referrer;
    }

    public function deleteReferrerOrder(ReferrerOrder $referrer): void
    {
        $referrer->delete();
        $this->logDeleted($referrer);
    }


    public function findReferrerOrderById(int|string $id): ?ReferrerOrder
    {
        return ReferrerOrder::find($id);
    }

    public function findReferrerOrderByEmail(string $email): ?ReferrerOrder
    {
        return ReferrerOrder::where("email", $email)->first();
    }

    /**
     * @param  Builder<ReferrerOrder>  $query
     */
    public function applyFilters(Builder $query, array $filters): void
    {
        if (isset($filters["search"])) {
            $query->search($filters["search"]);
        }
    }
}
