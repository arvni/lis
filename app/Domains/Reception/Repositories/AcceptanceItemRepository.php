<?php

namespace App\Domains\Reception\Repositories;

use App\Domains\Document\Enums\DocumentTag;
use App\Domains\Laboratory\Enums\TestType;
use App\Domains\Reception\Models\AcceptanceItem;
use App\Domains\Reception\Models\Report;
use Carbon\Carbon;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Gate;

class AcceptanceItemRepository
{

    public function listAcceptanceItems($queryData = [])
    {
        $query = AcceptanceItem::query()->with([
            "latestState" => function ($q) {
                $q->with([
                    "Section",
                    "FinishedBy:name,id",
                    "StartedBy:name,id"
                ]);
            },
            "invoice.owner",
            "report"
        ])
            ->withAggregate("activeSample", "collection_date")
            ->withAggregate("method", "name")
            ->withAggregate("test", "tests.name")
            ->withAggregate("patient", "fullName")
            ->withAggregate("patient", "dateOfBirth")
            ->withAggregate("patient", "idNo");
        return $this->applyAll($query, $queryData);
    }

    public function listAllAcceptanceItems($queryData = [])
    {
        $query = AcceptanceItem::query()->with([
            "invoice.owner",
            "latestState" => function ($q) {
                $q->with([
                    "Section",
                    "FinishedBy:name,id",
                    "StartedBy:name,id"
                ]);
            },
        ])
            ->withAggregate("activeSample", "collection_date")
            ->withAggregate("method", "name")
            ->withAggregate("test", "tests.name")
            ->withAggregate("patient", "fullName")
            ->withAggregate("patient", "dateOfBirth")
            ->withAggregate("patient", "idNo");
        if (isset($queryData["filters"]))
            $this->applyFilters($query, $queryData["filters"]);
        if (isset($queryData["sort"]))
            $query->orderBy($queryData['sort']['field'] ?? 'id', $queryData['sort']['sort'] ?? 'asc');
        return $query->get();
    }

    private function applyAll($query, $queryData)
    {
        if (isset($queryData["filters"]))
            $this->applyFilters($query, $queryData["filters"]);
        if (isset($queryData["sort"]))
            $query->orderBy($queryData['sort']['field'] ?? 'id', $queryData['sort']['sort'] ?? 'asc');
        return $query->paginate($queryData["pageSize"]);
    }


    public function listAcceptanceItemsReadyReport($queryData)
    {
        $query = AcceptanceItem::query();
        $query->reportLess();
        $this->limitAccess($query);
        $query->with(["method", "test", "patient:id,fullName,idNo"]);

        return $this->applyAll($query, $queryData);
    }

    public function creatAcceptanceItem(array $acceptanceItemData): AcceptanceItem
    {
        $acceptanceItem = AcceptanceItem::query()->create(Arr::except($acceptanceItemData, "patients"));
        $this->syncPatients($acceptanceItem, $acceptanceItemData["patients"]);
        return $acceptanceItem;
    }

    public function updateAcceptanceItem(AcceptanceItem $acceptanceItem, array $acceptanceItemData): AcceptanceItem
    {
        $acceptanceItem->fill(Arr::except($acceptanceItemData, "patients"));
        if ($acceptanceItem->isDirty())
            $acceptanceItem->save();
        if (isset($acceptanceItemData["patients"]))
            $this->syncPatients($acceptanceItem, $acceptanceItemData["patients"]);
        return $acceptanceItem;
    }

    public function deleteAcceptanceItem(AcceptanceItem $acceptanceItem): void
    {
        $acceptanceItem->delete();
    }

    public function findAcceptanceItemById($id): ?AcceptanceItem
    {
        return AcceptanceItem::find($id);
    }

    public function getWithReportingDetails(AcceptanceItem $acceptanceItem): AcceptanceItem
    {
        $acceptanceItem->load([
            "patients" => function ($q) {
                $q->with(["ownedDocuments" => function ($q) {
                    $q->whereIn("tag", [DocumentTag::DOCUMENT, DocumentTag::PRESCRIPTION]);
                }]);
            },
            "acceptanceItemStates.section",
            "acceptanceItemStates.startedBy:id,name",
            "acceptanceItemStates.finishedBy:id,name",
            "reports" => function ($q) {
                $q->where("status", false)
                    ->orderBy("approved_at")
                    ->with([
                        "documents",
                        "reporter:id,name",
                        "approver:id,name"]);
            }
        ]);

        return $acceptanceItem;
    }

    private function syncPatients(AcceptanceItem $acceptanceItem, $patients): void
    {
        $patientsList = collect($patients)
            ->unique("id") // Keep only first occurrence of each patient ID
            ->values() // Re-index the array
            ->map(fn($item, $index) => ["order" => $index, "main" => $index == 0 ? 1 : null, "id" => $item["id"]])
            ->keyBy("id")
            ->map(fn($item) => Arr::only($item, ["order", "main"]));
        $acceptanceItem->patients()
            ->sync($patientsList);
    }

    private function limitAccess($query)
    {
        if (Gate::allows("accessAll", Report::class)) {
            return;
        } else {
            $query->whereHas("AcceptanceItemStates", function ($q) {
                $q->where("finished_by_id", auth()->user()->id);
            });
        }
    }


    public function applyFilters($query, $filters = [])
    {
        if (isset($filters["search"])) {
            $query->where(function ($q) use ($filters) {
                $q
                    ->whereHas("patient", function ($q) use ($filters) {
                        $q->search($filters["search"]);
                    })
                    ->orWhereHas("samples", function ($q) use ($filters) {
                        $q->search($filters["search"]);
                    })
                    ->orWhereHas("test", function ($q) use ($filters) {
                        $q->search($filters["search"]);
                    });
            });
        }
        if (isset($filters["date"])) {
            $date = Carbon::parse($filters["date"]);
            $dateRange = [$date->copy()->startOfDay(), $date->copy()->endOfDay()];
            $query->whereBetween('created_at', $dateRange);
        }

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

    public function getTotalTestsForDateRange($dateRange): int
    {
        return AcceptanceItem::query()
            ->whereBetween("created_at", $dateRange)
            ->whereHas("test", function ($q) {
                $q->whereNot("type", TestType::SERVICE);
            })
            ->count();
    }

}
