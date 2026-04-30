<?php

namespace App\Domains\Laboratory\Repositories;

use App\Domains\Shared\Traits\LogsUserActivity;
use App\Domains\Laboratory\Models\BarcodeGroup;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class BarcodeGroupRepository
{
    use LogsUserActivity;


    public function listBarcodeGroups(array $queryData): LengthAwarePaginator
    {
        $query = BarcodeGroup::withCount(["methods"]);
        if (isset($queryData["filters"]))
            $this->applyFilters($query, $queryData["filters"]);
        if (isset($queryData["sort"]))
            $query->orderBy($queryData['sort']['field'] ?? 'id', $queryData['sort']['sort'] ?? 'asc');
        return $query->paginate($queryData["pageSize"] ?? 10);
    }

    public function creatBarcodeGroup(array $barcodeGroupData): BarcodeGroup
    {
        $barcodeGroup = BarcodeGroup::query()->make($barcodeGroupData);
        $barcodeGroup->save();
        $this->logCreated($barcodeGroup);
        return $barcodeGroup;
    }

    public function updateBarcodeGroup(BarcodeGroup $barcodeGroup, array $barcodeGroupData): BarcodeGroup
    {
        $barcodeGroup->fill($barcodeGroupData);
        if ($barcodeGroup->isDirty()) {
            $barcodeGroup->save();
            $this->logUpdated($barcodeGroup);
        }
        return $barcodeGroup;
    }

    public function deleteBarcodeGroup(BarcodeGroup $barcodeGroup): void
    {
        $barcodeGroup->delete();
        $this->logDeleted($barcodeGroup);
    }

    protected function applyFilters($query, array $filters)
    {
        if (isset($filters["search"]))
            $query->search(["name"], $filters["search"]);
    }

}
