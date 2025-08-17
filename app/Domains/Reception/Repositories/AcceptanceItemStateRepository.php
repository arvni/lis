<?php

namespace App\Domains\Reception\Repositories;

use App\Domains\Reception\Models\AcceptanceItemState;
use App\Domains\User\Enums\ActivityType;
use App\Domains\User\Services\UserActivityService;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class AcceptanceItemStateRepository
{

    public function listAcceptanceItemStates($queryData)
    {
        $query = AcceptanceItemState::with([
            "acceptanceItem.test",
            "acceptanceItem.method.test",
            "sample.patient"
        ]);
        if (isset($queryData["filters"]))
            $this->applyFilters($query, $queryData["filters"]);
        $query->orderBy($queryData['sort']['field'] ?? 'id', $queryData['sort']['sort'] ?? 'asc');
        return $query->paginate($queryData["pageSize"] ?? 10);
    }

    public function creatAcceptanceItemState(array $acceptanceItemStateData): AcceptanceItemState
    {
        $acceptanceItemState= AcceptanceItemState::query()->create($acceptanceItemStateData);
        UserActivityService::createUserActivity($acceptanceItemState,ActivityType::CREATE);
        return $acceptanceItemState;
    }

    public function updateAcceptanceItemState(AcceptanceItemState $acceptanceItemState, array $acceptanceItemStateData): AcceptanceItemState
    {
        $acceptanceItemState->fill($acceptanceItemStateData);
        if ($acceptanceItemState->isDirty()) {
            $acceptanceItemState->save();
            UserActivityService::createUserActivity($acceptanceItemState,ActivityType::UPDATE);
        }
        return $acceptanceItemState;
    }

    public function deleteAcceptanceItemState(AcceptanceItemState $acceptanceItemState): void
    {
        $acceptanceItemState->delete();
        UserActivityService::createUserActivity($acceptanceItemState,ActivityType::DELETE);
    }

    public function findAcceptanceItemStateById($id): ?AcceptanceItemState
    {
        return AcceptanceItemState::find($id);
    }


    public function findAcceptanceItemStateByBarcode($barcode): Collection
    {
        return AcceptanceItemState::whereHas("sample", function ($q) use ($barcode) {
            $q->where("barcode", $barcode);
        })
            ->get();
    }

    public function getAcceptanceItemStatesStats($sectionId): Collection
    {
        return AcceptanceItemState::where("section_id", $sectionId)
            ->select("status", DB::raw("count(*) as total"))
            ->groupBy("status")
            ->get();
    }

    private function applyFilters($query, array $filters): void
    {
        if (isset($filters["section_id"]))
            $query->where("section_id", $filters["section_id"]);
        if (isset($filters["status"]))
            $query->where("status", $filters["status"]);
        if (isset($filters["search"]))
            $query->search($filters["search"]);

        // Apply date range filtering on started_at field using Carbon
        if (!empty($filters["from_date"]) || !empty($filters["to_date"])) {
            // Set default values for the date range
            $startDate = !empty($filters["from_date"])
                ? Carbon::parse($filters["from_date"])->startOfDay()
                : Carbon::createFromTimestamp(0);

            $endDate = !empty($filters["to_date"])
                ? Carbon::parse($filters["to_date"])->endOfDay()
                : Carbon::now(); // Current time

            $query->whereBetween('created_at', [$startDate, $endDate]);
        }

    }

}
