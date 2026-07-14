<?php

namespace App\Domains\Reception\Repositories;

use App\Domains\Shared\Traits\LogsUserActivity;
use App\Domains\Reception\Models\AcceptanceItemState;
use App\Domains\Reception\Traits\ExtractsTagFilterIds;
use App\Domains\Reception\Traits\ExtractsTestFilterIds;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class AcceptanceItemStateRepository
{
    use LogsUserActivity, ExtractsTagFilterIds, ExtractsTestFilterIds;


    /**
     * @return LengthAwarePaginator<int, AcceptanceItemState>
     */
    public function listAcceptanceItemStates(array $queryData): LengthAwarePaginator
    {
        $query = AcceptanceItemState::with([
            "acceptanceItem.test",
            "acceptanceItem.method.test",
            "acceptanceItem.tags:id,name",
            "sample.patient"
        ])
        ->whereHas('acceptanceItem'); // Exclude acceptance item states where acceptance item is soft deleted

        if (isset($queryData["filters"]))
            $this->applyFilters($query, $queryData["filters"]);
        $query->orderBy($queryData['sort']['field'] ?? 'id', $queryData['sort']['sort'] ?? 'asc');
        return $query->paginate($queryData["pageSize"] ?? 10);
    }

    public function creatAcceptanceItemState(array $acceptanceItemStateData): AcceptanceItemState
    {
        $acceptanceItemState= AcceptanceItemState::query()->create($acceptanceItemStateData);
        $this->logCreated($acceptanceItemState);
        return $acceptanceItemState;
    }

    public function updateAcceptanceItemState(AcceptanceItemState $acceptanceItemState, array $acceptanceItemStateData): AcceptanceItemState
    {
        $acceptanceItemState->fill($acceptanceItemStateData);
        if ($acceptanceItemState->isDirty()) {
            $acceptanceItemState->save();
            $this->logUpdated($acceptanceItemState);
        }
        return $acceptanceItemState;
    }

    public function deleteAcceptanceItemState(AcceptanceItemState $acceptanceItemState): void
    {
        $acceptanceItemState->delete();
        $this->logDeleted($acceptanceItemState);
    }

    public function findAcceptanceItemStateById(int|string $id): ?AcceptanceItemState
    {
        return AcceptanceItemState::find($id);
    }


    /** @return Collection<int, AcceptanceItemState> */
    public function findAcceptanceItemStateByBarcode(string $barcode): Collection
    {
        return AcceptanceItemState::whereHas("sample", function ($q) use ($barcode) {
            $q->where("barcode", $barcode);
        })
            ->get();
    }

    /**
     * @return Collection<int, AcceptanceItemState>
     */
    public function getAcceptanceItemStatesStats(int|string $sectionId): Collection
    {
        return AcceptanceItemState::where("section_id", $sectionId)
            ->select("status", DB::raw("count(*) as total"))
            ->groupBy("status")
            ->get();
    }

    /**
     * @param  Builder<AcceptanceItemState>  $query
     */
    private function applyFilters(Builder $query, array $filters): void
    {
        if (isset($filters["section_id"]))
            $query->where("section_id", $filters["section_id"]);
        if (isset($filters["status"]))
            $query->where("status", $filters["status"]);
        if (isset($filters["search"]))
            $query->search($filters["search"]);

        $tagIds = $this->extractTagFilterIds($filters);
        if ($tagIds) {
            $query->whereHas('acceptanceItem.tags', fn($tagQuery) => $tagQuery->whereIn('tags.id', $tagIds));
        }

        $testIds = $this->extractTestFilterIds($filters);
        if ($testIds) {
            $query->whereHas('acceptanceItem.methodTest', fn($methodTestQuery) => $methodTestQuery->whereIn('test_id', $testIds));
        }

        // Apply date range filtering on started_at field using Carbon
        if (!empty($filters["from_date"]) || !empty($filters["to_date"])) {
            // Set default values for the date range
            $startDate = !empty($filters["from_date"])
                ? Carbon::parse($filters["from_date"])->startOfDay()
                : Carbon::createFromTimestamp(0);

            $endDate = !empty($filters["to_date"])
                ? Carbon::parse($filters["to_date"])->endOfDay()
                : now(); // Current time

            $query->whereBetween('created_at', [$startDate, $endDate]);
        }

    }

}
