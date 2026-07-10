<?php

namespace App\Domains\Reception\Repositories;

use App\Domains\Shared\Traits\LogsUserActivity;
use App\Domains\Document\Enums\DocumentTag;
use App\Domains\Laboratory\Enums\TestType;
use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Models\AcceptanceItem;
use App\Domains\Reception\Models\Report;
use App\Domains\Reception\Traits\ExtractsTagFilterIds;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Gate;

class AcceptanceItemRepository
{
    use LogsUserActivity, ExtractsTagFilterIds;


    /**
     * @return LengthAwarePaginator<int, AcceptanceItem>
     */
    public function listAcceptanceItems(array $queryData = []): LengthAwarePaginator
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
            "report",
            "activeSamples",
            "tags:id,name,color",
        ])
            ->withAggregate("method", "name")
            ->withAggregate("method", "turnaround_time")
            ->withAggregate("test", "tests.name")
            ->withAggregate("patient", "fullName")
            ->withAggregate("patient", "dateOfBirth")
            ->withAggregate("patient", "idNo");
        return $this->applyAll($query, $queryData);
    }

    /**
     * @return Collection<int, AcceptanceItem>
     */
    public function listAllAcceptanceItems(array $queryData = []): Collection
    {
        $query = AcceptanceItem::query()->with([
            "invoice.owner",
            "acceptance.referrer",
            "acceptance.patient",
            "tags:id,name",
            "latestState" => function ($q) {
                $q->with([
                    "Section",
                    "FinishedBy:name,id",
                    "StartedBy:name,id"
                ]);
            },
            "activeSamples",
        ])
            ->withAggregate("method", "name")
            ->withAggregate("method", "turnaround_time")
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

    /**
     * @param  Builder<AcceptanceItem>  $query
     * @return LengthAwarePaginator<int, AcceptanceItem>
     */
    private function applyAll(Builder $query, array $queryData): LengthAwarePaginator
    {
        if (isset($queryData["filters"]))
            $this->applyFilters($query, $queryData["filters"]);
        if (isset($queryData["sort"]))
            $query->orderBy($queryData['sort']['field'] ?? 'id', $queryData['sort']['sort'] ?? 'asc');
        return $query->paginate($queryData["pageSize"]);
    }


    /**
     * @return LengthAwarePaginator<int, AcceptanceItem>
     */
    public function listAcceptanceItemsReadyReport(array $queryData): LengthAwarePaginator
    {
        $query = AcceptanceItem::query();
        $query->reportLess();
        $this->limitAccess($query);
        $query->with(["method", "test", "patient:id,fullName,idNo"]);

        return $this->applyAll($query, $queryData);
    }

    public function creatAcceptanceItem(array $acceptanceItemData): AcceptanceItem
    {
        $acceptanceItem = AcceptanceItem::create(Arr::except($acceptanceItemData, ["patients", "id"]));

        $acceptanceItem->load('test');
        if ($acceptanceItem->test && $acceptanceItem->test->type === TestType::SERVICE) {
            $acceptanceItem->update(['no_sample' => 0, 'sampleless' => true, 'reportless' => true]);
        }

        if (isset($acceptanceItemData["customParameters"]["samples"])) {
            $patients = Arr::flatten(array_map(fn($item) => $item["patients"] ?? [], $acceptanceItemData["customParameters"]["samples"]), 1);
            $this->syncPatients($acceptanceItem, $patients);
        }
        $this->logCreated($acceptanceItem);
        return $acceptanceItem;
    }

    public function updateAcceptanceItem(AcceptanceItem $acceptanceItem, array $acceptanceItemData): AcceptanceItem
    {
        $acceptanceItem->fill(Arr::except($acceptanceItemData, ["patients", "id"]));
        if ($acceptanceItem->isDirty()) {
            $acceptanceItem->save();
        }
        if (isset($acceptanceItemData["customParameters"]["samples"])) {
            $patients = Arr::flatten(array_map(fn($item) => $item["patients"] ?? [], $acceptanceItemData["customParameters"]["samples"]), 1);
            $this->syncPatients($acceptanceItem, $patients);
        }
        $this->logUpdated($acceptanceItem);
        return $acceptanceItem;
    }

    public function deleteAcceptanceItem(AcceptanceItem $acceptanceItem): void
    {
        $acceptanceItem->delete();
        $this->logDeleted($acceptanceItem);
    }

    public function findAcceptanceItemById(int|string|null $id): ?AcceptanceItem
    {
        return AcceptanceItem::find($id);
    }

    /**
     * The acceptance (with patient loaded) that owns a given acceptance item,
     * or null when the item does not exist.
     */
    public function findAcceptanceForItem(int $itemId): ?Acceptance
    {
        return AcceptanceItem::with('acceptance.patient')->find($itemId)?->acceptance;
    }

    /**
     * The original (non-pooling) acceptance items for an acceptance, by id.
     *
     * @param  array<int, int|string>  $ids
     * @return Collection<int, AcceptanceItem>
     */
    public function getOriginalNonPoolingItems(Acceptance $acceptance, array $ids): Collection
    {
        return AcceptanceItem::whereIn('id', $ids)
            ->where('acceptance_id', $acceptance->id)
            ->where('is_pooling', false)
            ->get();
    }

    /**
     * An acceptance's items with method/test relations loaded, for building the
     * pooling-items payload.
     *
     * @return Collection<int, AcceptanceItem>
     */
    public function getPoolingSourceItems(Acceptance $acceptance): Collection
    {
        return AcceptanceItem::where('acceptance_id', $acceptance->id)
            ->with(['methodTest.test', 'methodTest.method'])
            ->get();
    }

    public function getWithReportingDetails(AcceptanceItem $acceptanceItem): AcceptanceItem
    {
        $acceptanceItem->load([
            "patients" => function ($q) {
                $q->with(["ownedDocuments" => function ($q) {
                    $q->allowedTag();
                }]);
            },
            "acceptanceItemStates.section",
            "acceptanceItemStates.sample.patient:id,fullName",
            "acceptanceItemStates.sample.sampleType",
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

    private function syncPatients(AcceptanceItem $acceptanceItem, array $patients): void
    {
        $patientsList = collect($patients)
            ->unique("id") // Keep only first occurrence of each patient ID
            ->values() // Re-index the array
            ->map(fn($item, $index) => ["order" => $index, "main" => $index == 0 ? 1 : null, "id" => $item["id"]])
            ->keyBy("id")
            ->map(fn($item) => Arr::only($item, ["order", "main"]));
        $acceptanceItem->patients()->sync($patientsList);
    }

    /**
     * @param  Builder<AcceptanceItem>  $query
     */
    private function limitAccess(Builder $query): void
    {
        if (Gate::allows("accessAll", Report::class)) {
            return;
        } else {
            $query->whereHas("AcceptanceItemStates", function ($q) {
                $q->where("finished_by_id", auth()->id());
            });
        }
    }

    // $query is intentionally untyped: typing it Builder<AcceptanceItem> makes the
    // whereHas(..., fn ($q) => $q->search(...)) closures resolve to Builder<Model>,
    // on which Larastan can't see the Searchable trait's search() scope (false positive).
    public function applyFilters($query, array $filters = []): void
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

        $tagIds = $this->extractTagFilterIds($filters);
        if ($tagIds) {
            $query->whereHas('tags', fn($tagQuery) => $tagQuery->whereIn('tags.id', $tagIds));
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

    public function getTotalTestsForDateRange(array $dateRange): int
    {
        return AcceptanceItem::query()
            ->whereBetween("created_at", $dateRange)
            ->whereHas("test", function ($q) {
                $q->whereNot("type", TestType::SERVICE);
            })
            ->count();
    }

    /**
     * Non-service acceptance items in the date range, eager-loaded for the daily cash report.
     *
     * @return Collection<int, AcceptanceItem>
     */
    public function getForCashReport(array $dateRange): Collection
    {
        return AcceptanceItem::query()
            ->whereBetween("created_at", $dateRange)
            ->whereHas("test", function ($q) {
                $q->whereNot("type", TestType::SERVICE);
            })
            ->with("test", "patients", "acceptance.patient", "acceptance.payments", "acceptance.referrer")
            ->get();
    }

    /**
     * Point the given acceptance items at an invoice item (used when composing invoices).
     */
    public function linkToInvoiceItem(array $ids, int $invoiceItemId): void
    {
        AcceptanceItem::query()
            ->whereIn("id", $ids)
            ->update(["invoice_item_id" => $invoiceItemId]);
    }

    /**
     * @return Collection<int, AcceptanceItem>
     */
    public function getPanelItems(int|string $panelId, int|string|null $acceptanceId = null): Collection
    {
        $query = AcceptanceItem::query()
            ->where("panel_id", $panelId)
            ->whereRelation("test", "type", TestType::PANEL);
        if ($acceptanceId) {
            $query->where("acceptance_id", $acceptanceId);
        }
        return $query->get();
    }

}
