<?php

namespace App\Domains\Reception\Repositories;


use App\Domains\Document\Enums\DocumentTag;
use App\Domains\Reception\Models\AcceptanceItem;
use App\Domains\Reception\Models\Report;
use Illuminate\Database\Eloquent\Collection;

class ReportRepository
{

    public function list($queryData)
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

    public function listWaitingForApproving($queryData)
    {
        $query = Report::query()
            ->notApproved()
            ->isActive()
            ->with([
                "acceptanceItem.method",
                "acceptanceItem.test",
                "reporter:id",
                "acceptanceItem.patients:id,fullName"
            ])
            ->withAggregate("reporter", "name");
        if (isset($queryData["filters"]))
            $this->applyFilters($query, $queryData["filters"]);

        if (isset($queryData["sort"]))
            $query->orderBy($queryData['sort']['field'] ?? 'id', $queryData['sort']['sort'] ?? 'asc');
        return $query->paginate($queryData["pageSize"] ?? 10);
    }

    public function create($data)
    {
        return Report::create($data);
    }

    public function getHistoryForAcceptanceItem(AcceptanceItem $acceptanceItem): Collection
    {
        $acceptanceItem->loadMissing(["reports" => function ($q) {
            $q->where("status", false);
        }]);
        return $acceptanceItem->reports;
    }

    public function update(Report $report, array $data): Report
    {
        $report->fill($data);
        if ($report->isDirty())
            $report->save();

        return $report;
    }

    public function applyFilters($query, array $filters): void
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
    }

    public function loadWithAllRelations(Report $report)
    {
        $report->load([
            "Documents" => function ($q) {
                $q->where("tag", DocumentTag::ADDITIONAL);
            },
            "AcceptanceItem" => function ($q) {
                $q->with([
                    "method",
                    "test",
                    "test.testGroup:name,id",
                    "patients" => function ($qu) {
                        $qu->with([
                            "OwnedDocuments" => function ($qur) {
                                $qur->where("tag", DocumentTag::DOCUMENT);
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
            "signers"
        ]);

        return $report;
    }


    /**
     * Load a report with relations needed for editing
     *
     * @param Report $report
     * @return Report
     */
    public function loadForEditing(Report $report): Report
    {
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
                    "test.testGroup"
                ]);
            },
            "signers"
        ]);

        return $report;
    }

    public function getTotalReportsWaitingForApproving(): int
    {
        return Report::query()->whereNull("approver_id")->count();
    }

}
