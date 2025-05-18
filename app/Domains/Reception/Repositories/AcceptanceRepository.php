<?php

namespace App\Domains\Reception\Repositories;

use App\Domains\Laboratory\Enums\TestType;
use App\Domains\Reception\Enums\AcceptanceStatus;
use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Models\Patient;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class AcceptanceRepository
{
    public function listAcceptances(array $queryData): LengthAwarePaginator
    {
        $query = Acceptance::withCount(["acceptanceItems"])
            ->with("samples:samples.id,barcode")
            ->withSum("payments", "price")
            ->withAggregate("referrer", "fullName")
            ->withAggregate("patient", "fullName")
            ->withAggregate("patient", "idNo")
            ->withSum("payments", "price")
            ->selectRaw('(select sum(acceptance_items.price) from acceptance_items where acceptances.id = acceptance_items.acceptance_id) -
                 (select sum(acceptance_items.discount) from acceptance_items where acceptances.id = acceptance_items.acceptance_id)
                 as payable_amount')
            ->addSelect([
                'report_date' => DB::table('acceptance_items')
                    ->join('method_tests', 'method_tests.id', '=', 'acceptance_items.method_test_id')
                    ->join('methods', 'methods.id', '=', 'method_tests.method_id')
                    ->selectRaw('MAX(methods.turnaround_time)')
                    ->whereColumn('acceptance_items.acceptance_id', 'acceptances.id')
            ]);
        if (isset($queryData["filters"]))
            $this->applyFilters($query, $queryData["filters"]);
        if (isset($queryData["sort"]))
            $query->orderBy($queryData['sort']['field'] ?? 'id', $queryData['sort']['sort'] ?? 'asc');
        return $query->paginate($queryData["pageSize"] ?? 10);
    }

    public function creatAcceptance(array $acceptanceData): Acceptance
    {
        return Acceptance::query()->create($acceptanceData);
    }

    public function updateAcceptance(Acceptance $acceptance, array $acceptanceData): Acceptance
    {
        $acceptance->fill($acceptanceData);
        if ($acceptance->isDirty())
            $acceptance->save();
        return $acceptance;
    }

    public function getAcceptanceById($id): ?Acceptance
    {
        return Acceptance::find($id);
    }

    public function deleteAcceptance(Acceptance $acceptance): void
    {
        $acceptance->delete();
    }

    public function listSampleCollection($queryData)
    {
        $query = Acceptance::withCount(["acceptanceItems"])
            ->with("acceptanceItems.methodTest.test")
            ->withSum("acceptanceItems", "price")
            ->withSum("acceptanceItems", "discount")
            ->withSum("payments", "price")
            ->withAggregate("patient", "fullName")
            ->withAggregate("patient", "idNo")
            ->whereHas("acceptanceItems", function ($query) {
                $query->whereDoesntHave('samples', function ($query) {
                    $query->where('acceptance_item_samples.active', true);
                });
                $query->whereHas("test", function ($query) {
                    $query->whereNot("type", TestType::SERVICE);
                });
            })
            ->selectRaw('COALESCE((select sum(acceptance_items.price) from acceptance_items where acceptances.id = acceptance_items.acceptance_id),0) -
                 COALESCE((select sum(acceptance_items.discount) from acceptance_items where acceptances.id = acceptance_items.acceptance_id),0)
                 as payable_amount')
            ->having(DB::raw("payable_amount - COALESCE(payments_sum_price,0)"), "<=", 0);
        if (isset($queryData["filters"]))
            $this->applyFilters($query, $queryData["filters"]);
        if (isset($queryData["sort"]))
            $query->orderBy($queryData['sort']['field'] ?? 'id', $queryData['sort']['sort'] ?? 'asc');
        return $query->paginate($queryData["pageSize"] ?? 10);
    }


    /**
     * Count published tests for an acceptance
     *
     * @param Acceptance $acceptance
     * @return int
     */
    public function countPublishedTests(Acceptance $acceptance): int
    {
        return $acceptance
            ->AcceptanceItems()
            ->whereHas("Report", function ($q) {
                $q->whereNotNull("published_at");
            })
            ->count();
    }

    /**
     * Count reportable tests for an acceptance
     *
     * @param Acceptance $acceptance
     * @return int
     */
    public function countReportableTests(Acceptance $acceptance): int
    {
        return $acceptance
            ->AcceptanceItems()
            ->isTest()
            ->count();
    }


    protected function applyFilters($query, array $filters)
    {
        if (isset($filters["search"]))
            $query->search($filters["search"]);
        if (isset($filters["status"]))
            $query->where("status", $filters["status"]);
        if (isset($filters["referrer_id"]))
            $query->where("referrer_id", $filters["referrer_id"]);
        if (isset($filters["patient_id"]))
            $query->where("patient_id", $filters["patient_id"]);

    }

    public function getPendingAcceptance(Patient $patient): ?Acceptance
    {
        return Acceptance::query()
            ->where("patient_id", $patient->id)
            ->where("status", AcceptanceStatus::PENDING)
            ->first();

    }

    /**
     * Group acceptance items by test type
     *
     * @param array $acceptanceItems
     * @return Collection
     */
    public function groupItemsByTestType(array $acceptanceItems): Collection
    {
        return collect($acceptanceItems)
            ->groupBy("method_test.test.type")
            ->map(function ($items, $type) {
                // Return items directly for TEST and SERVICE types
                if ($type == TestType::TEST->value || $type == TestType::SERVICE->value) {
                    return $items;
                }

                // Process PANEL type items
                return $this->processItemsAsPanel($items);
            });
    }

    /**
     * Process items as a panel type, grouping by test_id
     *
     * @param Collection $items
     * @return array
     */
    private function processItemsAsPanel(Collection $items): array
    {
        return $items
            ->groupBy("method_test.test_id")
            ->map(function ($panelItems) {
                return [
                    "panel" => $panelItems->first()["method_test"]["test"],
                    "acceptanceItems" => $panelItems,
                    "price" => $panelItems->sum("price"),
                    "discount" => $panelItems->sum("discount"),
                ];
            })
            ->values()
            ->all();
    }


    public function getTotalAcceptancesForDateRange($dateRange): int
    {
        return Acceptance::whereBetween("created_at", $dateRange)->count();
    }

    public function getTotalWaitingForSampling(): int
    {
        return Acceptance::query()
            ->whereNotIn("status", [AcceptanceStatus::PENDING, AcceptanceStatus::CANCELLED])
            ->whereHas('acceptanceItems', function ($q) {
                $q->whereHas("method.test", function ($q) {
                    $q->where("type", TestType::TEST);
                });
            }) // only acceptances that have at least one item
            ->whereDoesntHave('acceptanceItems.activeSamples') // none of the items have active samples
            ->withSum(['Payments as total_payments' => fn($query) => $query->select(DB::raw('COALESCE(SUM(price), 0)'))], 'price')
            ->withSum(['AcceptanceItems as total_price' => fn($query) => $query->select(DB::raw('COALESCE(SUM(price), 0)'))], 'price')
            ->withSum(['AcceptanceItems as total_discount' => fn($query) => $query->select(DB::raw('COALESCE(SUM(discount), 0)'))], 'discount')
            ->having('total_payments', '>=', DB::raw('total_price - total_discount'))
            ->count();
    }


}
