<?php

namespace App\Domains\Reception\Repositories;

use App\Domains\Laboratory\Enums\TestType;
use App\Domains\Reception\Enums\AcceptanceStatus;
use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Models\Patient;
use App\Domains\Setting\Services\SettingService;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

// Added for type hinting
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class AcceptanceRepository
{
    // Define constants for filter and sort keys for better maintainability
    private const FILTER_SEARCH = 'search';
    private const FILTER_STATUS = 'status';
    private const FILTER_REFERRER_ID = 'referrer_id';
    private const FILTER_PATIENT_ID = 'patient_id';

    private const SORT_FIELD = 'field';
    private const SORT_DIRECTION = 'sort'; // 'sort' seems to be the key used in the original code for direction

    public function __construct(private readonly SettingService $settingService)
    {
    }

    /**
     * Get the raw SQL expression for calculating payable amount.
     * Uses COALESCE to handle cases where there are no items or discounts.
     */
    private function getPayableAmountSql(): string
    {
        return 'COALESCE((SELECT SUM(acceptance_items.price) FROM acceptance_items WHERE acceptances.id = acceptance_items.acceptance_id), 0) -
                COALESCE((SELECT SUM(acceptance_items.discount) FROM acceptance_items WHERE acceptances.id = acceptance_items.acceptance_id), 0)';
    }

    public function listAcceptances(array $queryData): LengthAwarePaginator
    {
        $query = Acceptance::query()
            ->withCount('acceptanceItems')
            ->with('samples:samples.id,barcode') // Be specific with selected columns for relationships
            ->withSum('payments', 'price') // payment_sum_price
            ->withAggregate('referrer', 'fullName') // referrer_full_name
            ->withAggregate('patient', 'fullName')  // patient_full_name
            ->withAggregate('patient', 'idNo')      // patient_id_no
            ->selectRaw("({$this->getPayableAmountSql()}) as payable_amount")
            ->addSelect([
                'report_date' => DB::table('acceptance_items')
                    ->join('method_tests', 'method_tests.id', '=', 'acceptance_items.method_test_id')
                    ->join('methods', 'methods.id', '=', 'method_tests.method_id')
                    ->selectRaw('MAX(methods.turnaround_time)')
                    ->whereColumn('acceptance_items.acceptance_id', 'acceptances.id')
                // Consider adding a default or COALESCE if no items exist, to avoid NULL report_date
            ]);

        if (isset($queryData['filters'])) {
            $this->applyFilters($query, $queryData['filters']);
        }

        if (isset($queryData['sort'])) {
            $query->orderBy(
                $queryData['sort'][self::SORT_FIELD] ?? 'acceptances.id', // Qualify column name
                $queryData['sort'][self::SORT_DIRECTION] ?? 'desc'
            );
        } else {
            $query->orderBy('acceptances.id', 'asc'); // Default sort
        }

        return $query->paginate($queryData['pageSize'] ?? 10);
    }

    public function createAcceptance(array $acceptanceData): Acceptance // Fixed typo: creatAcceptance -> createAcceptance
    {
        return Acceptance::create($acceptanceData); // Using static create method
    }

    public function updateAcceptance(Acceptance $acceptance, array $acceptanceData): Acceptance
    {
        $acceptance->fill($acceptanceData);
        if ($acceptance->isDirty()) {
            $acceptance->save();
        }
        return $acceptance;
    }

    public function getAcceptanceById(int $id): ?Acceptance // Added type hint for $id
    {
        return Acceptance::find($id);
    }

    /**
     * Get an acceptance by ID or fail.
     */
    public function getAcceptanceByIdOrFail(int $id): Acceptance
    {
        return Acceptance::findOrFail($id);
    }

    public function deleteAcceptance(Acceptance $acceptance): void
    {
        // Consider adding logic here if deletion has side effects or requires checks
        $acceptance->delete();
    }

    public function listSampleCollection(array $queryData): LengthAwarePaginator
    {
        $minAllowablePaymentPercentage = (float)$this->settingService->getSettingByKey('Payment', 'minPayment');

        // Disable ONLY_FULL_GROUP_BY for this query
        DB::statement('SET SESSION sql_mode=(SELECT REPLACE(@@sql_mode,"ONLY_FULL_GROUP_BY",""))');

        $query = Acceptance::query()
            ->withCount('acceptanceItems')
            ->with('acceptanceItems.methodTest.test:id,name,type')
            ->withSum('acceptanceItems', 'price')
            ->withSum('acceptanceItems', 'discount')
            ->withSum('payments', 'price')
            ->withAggregate('patient', 'fullName')
            ->withAggregate('patient', 'idNo')
            ->whereHas('acceptanceItems', function (Builder $itemQuery) {
                $itemQuery->whereDoesntHave('samples', function (Builder $sampleQuery) {
                    $sampleQuery->where('acceptance_item_samples.active', true);
                });
                $itemQuery->whereHas('methodTest.test', function (Builder $testQuery) {
                    $testQuery->where('type', '!=', TestType::SERVICE);
                });
            })
            ->selectRaw("({$this->getPayableAmountSql()}) as payable_amount")
            ->groupBy('acceptances.id')
            ->havingRaw("COALESCE(payments_sum_price, 0) >= (({$this->getPayableAmountSql()}) * ? / 100)", [$minAllowablePaymentPercentage]);

        if (isset($queryData['filters'])) {
            $this->applyFilters($query, $queryData['filters']);
        }

        if (isset($queryData['sort'])) {
            $query->orderBy(
                $queryData['sort'][self::SORT_FIELD] ?? 'acceptances.id',
                $queryData['sort'][self::SORT_DIRECTION] ?? 'desc'
            );
        } else {
            $query->orderBy('acceptances.id', 'desc');
        }

        $result = $query->paginate($queryData['pageSize'] ?? 10);
        DB::statement('SET SESSION sql_mode=(SELECT @@global.sql_mode)');

        return $result;
    }

    /**
     * Count published tests for an acceptance.
     */
    public function countPublishedTests(Acceptance $acceptance): int
    {
        return $acceptance->acceptanceItems() // Assuming 'acceptanceItems' is the relationship method
        ->whereHas('report', function (Builder $q) { // Assuming 'report' is the relationship method
            $q->whereNotNull('published_at');
        })
            ->count();
    }

    /**
     * Count reportable (non-service) tests for an acceptance.
     */
    public function countReportableTests(Acceptance $acceptance): int
    {
        return $acceptance->acceptanceItems()
            // Assuming AcceptanceItem model has an 'isTest' scope or similar logic here:
            // This might be better as:
            ->whereHas('methodTest.test', function (Builder $q) {
                $q->where('type', '!=', TestType::SERVICE);
            })
            ->count();
        // If `isTest()` scope exists on AcceptanceItems and correctly filters non-service types, original is fine.
        // return $acceptance->acceptanceItems()->isTest()->count();
    }

    protected function applyFilters(Builder $query, array $filters): void // Changed $query type to Builder
    {
        if (isset($filters[self::FILTER_SEARCH])) {
            // Assuming Acceptance model has a 'scopeSearch'
            $query->search($filters[self::FILTER_SEARCH]);
        }
        if (isset($filters[self::FILTER_STATUS])) {
            $query->where('acceptances.status', $filters[self::FILTER_STATUS]); // Qualify column name
        }
        if (isset($filters[self::FILTER_REFERRER_ID])) {
            $query->where('acceptances.referrer_id', $filters[self::FILTER_REFERRER_ID]); // Qualify column name
        }
        if (isset($filters["referrer"]["id"])) {
            $query->where('acceptances.referrer_id', $filters["referrer"]["id"]); // Qualify column name
        }
        if (isset($filters[self::FILTER_PATIENT_ID])) {
            $query->where('acceptances.patient_id', $filters[self::FILTER_PATIENT_ID]); // Qualify column name
        }

        if (isset($filters["date"])){
            $date=Carbon::parse($filters["date"]);
            $dateRange=[$date->copy()->startOfDay(),$date->copy()->endOfDay()];
            $query->whereBetween('acceptances.created_at', $dateRange);
        }
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

    public function getPendingAcceptance(Patient $patient): ?Acceptance
    {
        return Acceptance::query()
            ->where('patient_id', $patient->id)
            ->where('status', AcceptanceStatus::PENDING)
            ->first();
    }

    /**
     * Group acceptance items by test type.
     *
     * @param array $acceptanceItemsData Array of acceptance item data (e.g., from a request).
     * If these are Eloquent models, ensure necessary relations are loaded.
     */
    public function groupItemsByTestType(array $acceptanceItemsData): Collection
    {
        return collect($acceptanceItemsData)
            ->groupBy(function ($item) {
                // Accessing nested properties. Ensure 'method_test' and 'test' are loaded if $item is a model,
                // or that the array structure is as expected.
                return $item['method_test']['test']['type'] instanceof TestType
                    ? $item['method_test']['test']['type']->value
                    : $item['method_test']['test']['type'];
            })
            ->map(function (Collection $items, string $type) { // Type hint $items as Collection
                if ($type === TestType::TEST->value || $type === TestType::SERVICE->value) {
                    return $items;
                }
                // Assumes PANEL type is the only other possibility based on original logic
                return $this->processPanelItems($items); // Renamed for clarity
            });
    }

    /**
     * Process items belonging to a panel, grouping them by their parent test_id.
     */
    private function processPanelItems(Collection $items): array // Renamed from processItemsAsPanel
    {
        return $items
            ->groupBy('method_test.test_id') // Group by the panel's main test ID
            ->map(function (Collection $panelItems) { // Type hint $panelItems as Collection
                $firstItem = $panelItems->first();
                // Ensure 'method_test' and 'test' are available in the structure of $firstItem
                return [
                    // 'panel' should represent the panel itself, not just one of its items' test
                    'panel' => $firstItem['method_test']['test'], // This assumes the 'test' here is the panel definition
                    'acceptanceItems' => $panelItems,
                    'price' => $panelItems->sum('price'),
                    'discount' => $panelItems->sum('discount'),
                ];
            })
            ->values() // Reset keys to a simple indexed array
            ->all();
    }

    /**
     * Get total number of acceptances within a given date range.
     *
     * @param array $dateRange ['start_date', 'end_date']
     */
    public function getTotalAcceptancesForDateRange(array $dateRange): int
    {
        // Basic validation for dateRange might be useful here or in the calling service
        return Acceptance::whereBetween('created_at', $dateRange)->count();
    }

    /**
     * Get total number of acceptances that are fully paid and awaiting sampling for at least one test item.
     */
    public function getTotalWaitingForSampling(): int
    {
        return Acceptance::query()
            ->whereNotIn('status', [AcceptanceStatus::PENDING, AcceptanceStatus::CANCELLED])
            ->whereExists(function ($query) {
                $query->select(DB::raw(1))
                    ->from('acceptance_items')
                    ->join('method_tests', 'acceptance_items.method_test_id', '=', 'method_tests.id')
                    ->join('tests', 'method_tests.test_id', '=', 'tests.id')
                    ->whereColumn('acceptance_items.acceptance_id', 'acceptances.id')
                    ->where('tests.type', TestType::TEST);
            })
            ->whereNotExists(function ($query) {
                $query->select(DB::raw(1))
                    ->from('acceptance_items')
                    ->join('acceptance_item_samples', function ($join) {
                        $join->on('acceptance_items.id', '=', 'acceptance_item_samples.acceptance_item_id')
                            ->where('acceptance_item_samples.active',true); // Adjust status condition as needed
                    })
                    ->whereColumn('acceptance_items.acceptance_id', 'acceptances.id');
            })
            ->whereExists(function ($query) {
                $query->select(DB::raw(1))
                    ->from('payments')
                    ->leftJoin("invoices", "payments.invoice_id", "=", "invoices.id")
                    ->whereColumn('invoices.id', 'acceptances.invoice_id')
                    ->havingRaw('COALESCE(SUM(payments.price), 0) >= (
                    SELECT COALESCE(SUM(ai.price - ai.discount), 0)
                    FROM acceptance_items ai
                    WHERE ai.acceptance_id = acceptances.id
                )');
            })
            ->count();
    }
}
