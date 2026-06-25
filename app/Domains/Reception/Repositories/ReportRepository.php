<?php

namespace App\Domains\Reception\Repositories;


use App\Domains\Shared\Traits\LogsUserActivity;
use App\Domains\Document\Enums\DocumentTag;
use App\Domains\Reception\Models\AcceptanceItem;
use App\Domains\Reception\Models\Report;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

class ReportRepository
{
    use LogsUserActivity;


    /**
     * @return LengthAwarePaginator<int, Report>
     */
    public function list(array $queryData): LengthAwarePaginator
    {
        $query = Report::query();
        $query->with([
            "acceptanceItem.method",
            "acceptanceItem.test",
            "reporter:id",
            "acceptanceItem.patients:id,fullName"
        ])
            ->withAggregate("reporter", "name")
            ->withAggregate("publisher", "name")
            ->withAggregate("approver", "name");
        if (isset($queryData["filters"]))
            $this->applyFilters($query, $queryData["filters"]);

        if (isset($queryData["sort"]))
            $query->orderBy($queryData['sort']['field'] ?? 'id', $queryData['sort']['sort'] ?? 'asc');
        return $query->paginate($queryData["pageSize"] ?? 10);
    }

    /** Shared eager loads used by the approval and publish list queries. */
    private function reportListEagerLoads(): array
    {
        return [
            "acceptanceItem.method",
            "acceptanceItem.test",
            "acceptanceItem.patients:id,fullName",
        ];
    }

    /**
     * @return LengthAwarePaginator<int, Report>
     */
    public function listWaitingForApproving(array $queryData): LengthAwarePaginator
    {
        $query = Report::query()
            ->notApproved()
            ->isActive()
            ->approvableBy(auth()->user())
            ->with(array_merge($this->reportListEagerLoads(), ["reporter:id", "reportTemplate.approvalFlow.steps"]))
            ->withAggregate("reporter", "name");
        if (isset($queryData["filters"]))
            $this->applyFilters($query, $queryData["filters"]);

        if (isset($queryData["sort"]))
            $query->orderBy($queryData['sort']['field'] ?? 'id', $queryData['sort']['sort'] ?? 'asc');
        return $query->paginate($queryData["pageSize"] ?? 10);
    }

    /**
     * @return LengthAwarePaginator<int, Report>
     */
    public function listWaitingForPublish(array $queryData): LengthAwarePaginator
    {
        $query = Report::query()
            ->whereNotNull("reports.approved_at")
            ->whereNull("reports.published_at")
            ->isActive()
            ->with(array_merge($this->reportListEagerLoads(), ["acceptanceItem.acceptance.referrer"]))
            ->withAggregate("reporter", "name")
            ->withAggregate("approver", "name");
        if (isset($queryData["filters"]))
            $this->applyFilters($query, $queryData["filters"]);

        if (isset($queryData["sort"]))
            $query->orderBy($queryData['sort']['field'] ?? 'id', $queryData['sort']['sort'] ?? 'asc');
        return $query->paginate($queryData["pageSize"] ?? 10);
    }

    public function create(array $data): Report
    {
        $report = Report::create($data);
        $this->logCreated($report);
        return $report;
    }

    public function getHistoryForAcceptanceItem(AcceptanceItem $acceptanceItem): Collection
    {
        return Report::where("acceptance_item_id", $acceptanceItem->id)
            ->where("status", false)
            ->orderBy("approved_at")
            ->with([
                "Documents",
                "Reporter:name,id",
                "Approver:name,id",
            ])
            ->get();
    }

    public function update(Report $report, array $data): Report
    {
        $report->fill($data);
        if ($report->isDirty()) {
            $report->save();
            $this->logUpdated($report);
        }

        return $report;
    }

    /**
     * @param  Builder<Report>  $query
     */
    public function applyFilters(Builder $query, array $filters): void
    {
        if (isset($filters["acceptance_item_id"]))
            $query->where("acceptance_item_id", $filters["acceptance_item_id"]);
        if (isset($filters["patient_id"]))
            $query->whereHas("acceptanceItem", function ($q) use ($filters) {
                $q->whereHas("patient", fn($q) => $q->where("patients.id", $filters["patient_id"]));
            });
        if (isset($filters["patient_id"]))
            $query->whereHas("acceptanceItem", function ($q) use ($filters) {
                $q->whereHas("patient", fn($q) => $q->where("patients.id", $filters["patient_id"]));
            });
        if (isset($filters["search"])) {
            $query->search($filters["search"]);
        }
        if (isset($filters["reporter_id"])) {
            $query->where("reporter_id", $filters["reporter_id"]);
        }
    }

    /**
     * Load the full relation tree for displaying a single report.
     * Only call with a persisted Report model; never use in list queries.
     *
     * @throws \LogicException if $report is not a persisted Report instance
     */
    public function loadWithAllRelations(Report $report): Report
    {
        assert($report instanceof Report, 'loadWithAllRelations expects a persisted Report model');
        $report->load([
            "Documents" => function ($q) {
                $q->where("tag", DocumentTag::ADDITIONAL);
            },
            "AcceptanceItem" => function ($q) {
                $q->with([
                    "method",
                    "test",
                    "test.testGroups:name,id",
                    "patients" => function ($qu) {
                        $qu->with([
                            "OwnedDocuments"
                            => function ($q) {
                                $q->allowedTag();
                            },
                            "consultation"
                        ]);
                    },
                    "acceptanceItemStates.section:name,id",
                    "acceptanceItemStates.finishedBy:name,id",
                    "acceptanceItemStates.startedBy:name,id"
                ]);
            },
            "reporter:name,id",
            "approver:name,id",
            "publisher:name,id",
            "signers",
            "approvals",
            "reportTemplate.approvalFlow.steps.role:id,name",
            "reportTemplate.approvalFlow.steps.user:id,name"
        ]);

        return $report;
    }


    /**
     * Load relations needed to edit a single report.
     * Only call with a persisted Report model; never use in list queries.
     *
     * @throws \LogicException if $report is not a persisted Report instance
     */
    public function loadForEditing(Report $report): Report
    {
        assert($report instanceof Report, 'loadForEditing expects a persisted Report model');
        $report->load([
            "documents",
            "acceptanceItem" => function ($q) {
                $q->with([
                    "patients" => function ($qp) {
                        $qp->with([
                            "ownedDocuments" => function ($qd) {
                                $qd->whereNot("tag", "temp");
                            }
                        ]);
                    },
                    "acceptanceItemStates" => function ($q) {
                        $q->with("section");
                    },
                    "method" => function ($q) {
                        $q->with("test.reportTemplates.template");
                    },
                    "test.testGroups"
                ]);
            },
            "signers",
            "parameters.parameter",
            "reportTemplate.template",
            "reportTemplate.parameters"
        ]);

        return $report;
    }

    public function getTotalReportsWaitingForApproving(): int
    {
        return Report::query()->whereNull("approver_id")->count();
    }

}
