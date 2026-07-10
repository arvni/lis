<?php

namespace App\Domains\Billing\Services;

use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class BillingDashboardService
{
    // ── Date preset resolver ──────────────────────────────────────────────────

    public function resolveDates(array $filters): array
    {
        $now = now();

        return match ($filters['preset'] ?? null) {
            'today'         => [$now->copy()->startOfDay(),              $now->copy()->endOfDay()],
            'this_week'     => [$now->copy()->startOfWeek(),             $now->copy()->endOfWeek()],
            'last_week'     => [$now->copy()->subWeek()->startOfWeek(),  $now->copy()->subWeek()->endOfWeek()],
            'this_month'    => [$now->copy()->startOfMonth(),            $now->copy()->endOfMonth()],
            'last_month'    => [$now->copy()->subMonth()->startOfMonth(),$now->copy()->subMonth()->endOfMonth()],
            'last_7_days'   => [$now->copy()->subDays(7),                $now],
            'last_30_days'  => [$now->copy()->subDays(30),               $now],
            'last_3_months' => [$now->copy()->subMonths(3),              $now],
            'this_year'     => [$now->copy()->startOfYear(),             $now->copy()->endOfYear()],
            default         => [
                !empty($filters['from']) ? Carbon::parse($filters['from'])->startOfDay() : $now->copy()->subDays(30),
                !empty($filters['to'])   ? Carbon::parse($filters['to'])->endOfDay()   : $now,
            ],
        };
    }

    // ── Shared base queries ───────────────────────────────────────────────────
    // Invoiced totals come from invoice_items (filtered by invoices.created_at).
    // Non-invoiced totals come from acceptance_items where the acceptance has no
    // invoice (filtered by acceptance_items.created_at).
    // has_invoice filter:
    //   '1'  → invoiced only
    //   '0'  → non-invoiced only
    //   ''   → both

    private function invoicedItemsQuery(array $filters, Carbon $from, Carbon $to): \Illuminate\Database\Query\Builder
    {
        $q = DB::table('invoice_items')
            ->join('invoices', 'invoices.id', '=', 'invoice_items.invoice_id')
            ->leftJoin('acceptances', 'acceptances.id', '=', 'invoice_items.acceptance_id')
            ->whereNull('invoice_items.deleted_at')
            ->where(function ($w) {
                $w->whereNull('invoice_items.acceptance_id')
                  ->orWhere('acceptances.status', '!=', 'Canceled');
            })
            ->whereBetween('invoices.created_at', [$from, $to]);

        if (!empty($filters['referrer_id'])) {
            $q->where('acceptances.referrer_id', $filters['referrer_id']);
        }

        $testIds = array_filter((array) ($filters['test_ids'] ?? []));
        if (!empty($testIds)) {
            $q->where(function ($w) use ($testIds) {
                $w->whereIn('invoice_items.test_id', $testIds)
                  ->orWhereExists(fn($sub) => $sub
                      ->from('acceptance_items')
                      ->join('method_tests', 'method_tests.id', '=', 'acceptance_items.method_test_id')
                      ->whereColumn('acceptance_items.invoice_item_id', 'invoice_items.id')
                      ->whereNull('acceptance_items.deleted_at')
                      ->whereIn('method_tests.test_id', $testIds)
                  );
            });
        }

        return $q;
    }

    private function nonInvoicedItemsQuery(array $filters, Carbon $from, Carbon $to): \Illuminate\Database\Query\Builder
    {
        $q = DB::table('acceptance_items')
            ->join('acceptances', 'acceptances.id', '=', 'acceptance_items.acceptance_id')
            ->whereNull('acceptance_items.deleted_at')
            ->whereNull('acceptances.invoice_id')
            ->where('acceptances.status', '!=', 'Canceled')
            ->whereBetween('acceptance_items.created_at', [$from, $to]);

        if (!empty($filters['referrer_id'])) {
            $q->where('acceptances.referrer_id', $filters['referrer_id']);
        }

        $testIds = array_filter((array) ($filters['test_ids'] ?? []));
        if (!empty($testIds)) {
            $q->whereExists(fn($sub) => $sub
                ->from('method_tests')
                ->whereColumn('method_tests.id', 'acceptance_items.method_test_id')
                ->whereIn('method_tests.test_id', $testIds)
            );
        }

        return $q;
    }

    // Acceptance/invoice counts still come from acceptances (not items).
    private function acceptanceCountsQuery(array $filters, Carbon $from, Carbon $to): \Illuminate\Database\Query\Builder
    {
        $hasInvoice = $filters['has_invoice'] ?? '';

        $q = DB::table('acceptance_items')
            ->join('acceptances', 'acceptances.id', '=', 'acceptance_items.acceptance_id')
            ->leftJoin('invoices', 'invoices.id', '=', 'acceptances.invoice_id')
            ->whereNull('acceptance_items.deleted_at')
            ->where('acceptances.status', '!=', 'Canceled');

        if ($hasInvoice === '1') {
            $q->whereNotNull('acceptances.invoice_id')
              ->whereBetween('invoices.created_at', [$from, $to]);
        } elseif ($hasInvoice === '0') {
            $q->whereNull('acceptances.invoice_id')
              ->whereBetween('acceptance_items.created_at', [$from, $to]);
        } else {
            $q->where(function ($q) use ($from, $to) {
                $q->where(function ($s) use ($from, $to) {
                    $s->whereNotNull('acceptances.invoice_id')
                      ->whereBetween('invoices.created_at', [$from, $to]);
                })->orWhere(function ($s) use ($from, $to) {
                    $s->whereNull('acceptances.invoice_id')
                      ->whereBetween('acceptance_items.created_at', [$from, $to]);
                });
            });
        }

        if (!empty($filters['referrer_id'])) {
            $q->where('acceptances.referrer_id', $filters['referrer_id']);
        }

        $testIds = array_filter((array) ($filters['test_ids'] ?? []));
        if (!empty($testIds)) {
            $q->whereExists(fn($sub) => $sub
                ->from('method_tests')
                ->whereColumn('method_tests.id', 'acceptance_items.method_test_id')
                ->whereIn('method_tests.test_id', $testIds)
            );
        }

        return $q;
    }

    // ── Summary cards ─────────────────────────────────────────────────────────

    public function getSummary(array $filters): array
    {
        [$from, $to] = $this->resolveDates($filters);
        $hasInvoice = $filters['has_invoice'] ?? '';

        $invoicedRevenue = 0.0;
        if ($hasInvoice !== '0') {
            $invoicedRevenue = (float) $this->invoicedItemsQuery($filters, $from, $to)
                ->sum(DB::raw('invoice_items.price - invoice_items.discount'));
        }

        $nonInvoicedRevenue = 0.0;
        if ($hasInvoice !== '1') {
            $nonInvoicedRevenue = (float) $this->nonInvoicedItemsQuery($filters, $from, $to)
                ->sum(DB::raw('acceptance_items.price - acceptance_items.discount'));
        }

        $totalRevenue = $invoicedRevenue + $nonInvoicedRevenue;

        $counts = $this->acceptanceCountsQuery($filters, $from, $to)
            ->selectRaw('COUNT(DISTINCT acceptances.id) as acceptance_count,
                          COUNT(DISTINCT acceptances.invoice_id) as invoice_count')
            ->first();

        // Payments: filter by invoice creation date (not acceptance date)
        $paymentsQ = DB::table('payments')
            ->join('invoices', 'invoices.id', '=', 'payments.invoice_id')
            ->whereBetween('invoices.created_at', [$from, $to]);

        if (!empty($filters['referrer_id'])) {
            $paymentsQ->join('acceptances', 'acceptances.invoice_id', '=', 'invoices.id')
                      ->where('acceptances.referrer_id', $filters['referrer_id']);
        }

        $collected = (float) $paymentsQ->sum('payments.price');

        return [
            'revenue'          => round($totalRevenue, 3),
            'collected'        => round($collected, 3),
            'outstanding'      => round($totalRevenue - $collected, 3),
            'acceptance_count' => (int) ($counts->acceptance_count ?? 0),
            'invoice_count'    => (int) ($counts->invoice_count ?? 0),
            'from'             => $from->toDateString(),
            'to'               => $to->toDateString(),
        ];
    }

    // ── Monthly trend ─────────────────────────────────────────────────────────
    // Always shows BOTH invoiced (using invoice date) and non-invoiced
    // (using acceptance date) as separate series on the same x-axis.
    // Filters: t_referrer_id, t_test_id, t_months (default 12, max 36)

    public function getByMonth(array $filters): array
    {
        $months = max(1, min(36, (int) ($filters['t_months'] ?? 12)));
        $from  = now()->subMonths($months)->startOfMonth();
        $to    = now()->endOfMonth();

        $trendFilters = [
            'referrer_id' => $filters['t_referrer_id'] ?? null,
            'test_ids'    => $filters['t_test_id'] ?? [],
        ];

        // ① Invoiced — grouped by invoice creation month, from invoice_items
        $invoicedMap = $this->invoicedItemsQuery($trendFilters, $from, $to)
            ->selectRaw("DATE_FORMAT(invoices.created_at, '%Y-%m') AS period,
                          ROUND(SUM(invoice_items.price - invoice_items.discount),3) AS income")
            ->groupBy('period')
            ->get()
            ->keyBy('period');

        // ② Non-invoiced — grouped by acceptance_item creation month
        $nonInvoicedMap = $this->nonInvoicedItemsQuery($trendFilters, $from, $to)
            ->selectRaw("DATE_FORMAT(acceptance_items.created_at, '%Y-%m') AS period,
                          ROUND(SUM(acceptance_items.price - acceptance_items.discount),3) AS income")
            ->groupBy('period')
            ->get()
            ->keyBy('period');

        // Fill every month with both series (0 when no data)
        $result = [];
        $cursor = $from->copy()->startOfMonth();
        while ($cursor->lte($to)) {
            $key = $cursor->format('Y-m');
            $result[] = [
                'period'              => $key,
                'label'               => $cursor->format('M Y'),
                'invoiced_income'     => (float) ($invoicedMap->get($key)->income ?? 0),
                'non_invoiced_income' => (float) ($nonInvoicedMap->get($key)->income ?? 0),
            ];
            $cursor->addMonth();
        }
        return $result;
    }

    // ── Income by test ────────────────────────────────────────────────────────

    public function getByTest(array $filters): array
    {
        [$from, $to] = $this->resolveDates($filters);
        // Charts always show both invoiced and non-invoiced — ignore has_invoice
        $f = array_merge($filters, ['has_invoice' => '']);

        $invoicedByTest    = $this->invoicedIncomeByTest($f, $from, $to);
        $nonInvoicedByTest = $this->nonInvoicedIncomeByTest($f, $from, $to);

        $merged = [];
        foreach ($invoicedByTest as $row) {
            $merged[$row->test_id] = [
                'name'                => $row->test_name,
                'invoiced_income'     => (float) $row->income,
                'non_invoiced_income' => 0.0,
                'count'               => (int) $row->count,
            ];
        }
        foreach ($nonInvoicedByTest as $row) {
            if (isset($merged[$row->test_id])) {
                $merged[$row->test_id]['non_invoiced_income'] = (float) $row->income;
                $merged[$row->test_id]['count'] += (int) $row->count;
            } else {
                $merged[$row->test_id] = [
                    'name'                => $row->test_name,
                    'invoiced_income'     => 0.0,
                    'non_invoiced_income' => (float) $row->income,
                    'count'               => (int) $row->count,
                ];
            }
        }

        usort($merged, fn($a, $b) =>
            ($b['invoiced_income'] + $b['non_invoiced_income'])
            <=> ($a['invoiced_income'] + $a['non_invoiced_income'])
        );

        return array_slice(array_values($merged), 0, 25);
    }

    // Invoiced income per test, sourced from invoice_items. Panel rows split
    // their (price − discount) equally across the distinct underlying tests in
    // the same invoice_item bucket.
    private function invoicedIncomeByTest(array $filters, Carbon $from, Carbon $to): \Illuminate\Support\Collection
    {
        // Single (non-panel) invoice_items: attribute fully to invoice_items.test_id
        $singles = $this->invoicedItemsQuery($filters, $from, $to)
            ->join('tests', 'tests.id', '=', 'invoice_items.test_id')
            ->whereNull('invoice_items.panel_id')
            ->whereNotNull('invoice_items.test_id')
            ->selectRaw('
                tests.id   AS test_id,
                tests.name AS test_name,
                COUNT(*)   AS count,
                ROUND(SUM(invoice_items.price - invoice_items.discount), 3) AS income
            ')
            ->groupBy('tests.id', 'tests.name')
            ->get();

        // Panel invoice_items: derive one (invoice_item, test) pair per distinct
        // underlying test, then split (price − discount) equally across them.
        $panelPairs = DB::table('acceptance_items')
            ->join('method_tests', 'method_tests.id', '=', 'acceptance_items.method_test_id')
            ->whereNull('acceptance_items.deleted_at')
            ->whereNotNull('acceptance_items.invoice_item_id')
            ->groupBy('acceptance_items.invoice_item_id', 'method_tests.test_id')
            ->select(
                'acceptance_items.invoice_item_id as invoice_item_id',
                'method_tests.test_id as test_id'
            );

        $panelTestCounts = DB::table('acceptance_items')
            ->join('method_tests', 'method_tests.id', '=', 'acceptance_items.method_test_id')
            ->whereNull('acceptance_items.deleted_at')
            ->whereNotNull('acceptance_items.invoice_item_id')
            ->selectRaw('acceptance_items.invoice_item_id AS invoice_item_id,
                          COUNT(DISTINCT method_tests.test_id) AS test_count')
            ->groupBy('acceptance_items.invoice_item_id');

        $panels = $this->invoicedItemsQuery($filters, $from, $to)
            ->joinSub($panelPairs, 'pp', 'pp.invoice_item_id', '=', 'invoice_items.id')
            ->join('tests', 'tests.id', '=', 'pp.test_id')
            ->leftJoinSub($panelTestCounts, 'ptc', 'ptc.invoice_item_id', '=', 'invoice_items.id')
            ->whereNotNull('invoice_items.panel_id')
            ->selectRaw('
                tests.id   AS test_id,
                tests.name AS test_name,
                COUNT(*)   AS count,
                ROUND(SUM((invoice_items.price - invoice_items.discount) / GREATEST(ptc.test_count, 1)), 3) AS income
            ')
            ->groupBy('tests.id', 'tests.name')
            ->get();

        return $singles->concat($panels)
            ->groupBy('test_id')
            ->map(function ($rows) {
                $first = $rows->first();
                return (object) [
                    'test_id'   => $first->test_id,
                    'test_name' => $first->test_name,
                    'count'     => (int) $rows->sum('count'),
                    'income'    => (float) $rows->sum('income'),
                ];
            })
            ->values();
    }

    // Non-invoiced income per test, sourced from acceptance_items. Panel rows
    // split their (price − discount) equally across the distinct tests in the
    // same panel within the same acceptance.
    private function nonInvoicedIncomeByTest(array $filters, Carbon $from, Carbon $to): \Illuminate\Support\Collection
    {
        $panelTotals = (clone $this->nonInvoicedItemsQuery($filters, $from, $to))
            ->whereNotNull('acceptance_items.panel_id')
            ->selectRaw('
                acceptance_items.panel_id AS panel_id,
                COUNT(DISTINCT acceptance_items.method_test_id) AS distinct_tests,
                SUM(acceptance_items.price - acceptance_items.discount) AS panel_total
            ')
            ->groupBy('acceptance_items.panel_id');

        return $this->nonInvoicedItemsQuery($filters, $from, $to)
            ->join('method_tests', 'method_tests.id', '=', 'acceptance_items.method_test_id')
            ->join('tests',        'tests.id',        '=', 'method_tests.test_id')
            ->leftJoinSub($panelTotals, 'pt', 'pt.panel_id', '=', 'acceptance_items.panel_id')
            ->selectRaw('
                tests.id   AS test_id,
                tests.name AS test_name,
                COUNT(*)   AS count,
                ROUND(SUM(CASE WHEN acceptance_items.panel_id IS NULL
                               THEN acceptance_items.price - acceptance_items.discount
                               ELSE pt.panel_total / pt.distinct_tests END), 3) AS income
            ')
            ->groupBy('tests.id', 'tests.name')
            ->get();
    }

    // ── Income by referrer ────────────────────────────────────────────────────

    public function getByReferrer(array $filters): array
    {
        [$from, $to] = $this->resolveDates($filters);
        $f = array_merge($filters, ['has_invoice' => '']);

        // Invoiced — from invoice_items, attributed to the acceptance's referrer
        $invoicedRows = $this->invoicedItemsQuery($f, $from, $to)
            ->leftJoin('referrers', 'referrers.id', '=', 'acceptances.referrer_id')
            ->selectRaw("
                COALESCE(acceptances.referrer_id, 0)                                      AS referrer_id,
                COALESCE(referrers.fullName, 'Direct')                                    AS referrer_name,
                COUNT(DISTINCT acceptances.id)                                            AS acceptance_count,
                ROUND(SUM(invoice_items.price - invoice_items.discount), 3)               AS income
            ")
            ->groupBy('acceptances.referrer_id', 'referrers.fullName')
            ->get();

        // Non-invoiced — from acceptance_items where invoice_id is NULL
        $nonInvoicedRows = $this->nonInvoicedItemsQuery($f, $from, $to)
            ->leftJoin('referrers', 'referrers.id', '=', 'acceptances.referrer_id')
            ->selectRaw("
                COALESCE(acceptances.referrer_id, 0)                                          AS referrer_id,
                COALESCE(referrers.fullName, 'Direct')                                        AS referrer_name,
                COUNT(DISTINCT acceptances.id)                                                AS acceptance_count,
                ROUND(SUM(acceptance_items.price - acceptance_items.discount), 3)             AS income
            ")
            ->groupBy('acceptances.referrer_id', 'referrers.fullName')
            ->get();

        $merged = [];
        foreach ($invoicedRows as $row) {
            $merged[$row->referrer_id] = [
                'name'                => $row->referrer_name,
                'invoiced_income'     => (float) $row->income,
                'non_invoiced_income' => 0.0,
                'acceptance_count'    => (int) $row->acceptance_count,
            ];
        }
        foreach ($nonInvoicedRows as $row) {
            if (isset($merged[$row->referrer_id])) {
                $merged[$row->referrer_id]['non_invoiced_income'] = (float) $row->income;
                $merged[$row->referrer_id]['acceptance_count']   += (int) $row->acceptance_count;
            } else {
                $merged[$row->referrer_id] = [
                    'name'                => $row->referrer_name,
                    'invoiced_income'     => 0.0,
                    'non_invoiced_income' => (float) $row->income,
                    'acceptance_count'    => (int) $row->acceptance_count,
                ];
            }
        }

        $rows = array_values($merged);
        usort($rows, fn($a, $b) =>
            ($b['invoiced_income'] + $b['non_invoiced_income'])
            <=> ($a['invoiced_income'] + $a['non_invoiced_income'])
        );

        return array_slice($rows, 0, 20);
    }

    // ── Payments by method ────────────────────────────────────────────────────

    public function getByPaymentMethod(array $filters): array
    {
        [$from, $to] = $this->resolveDates($filters);

        $q = DB::table('payments')
            ->join('invoices', 'invoices.id', '=', 'payments.invoice_id')
            ->whereBetween('invoices.created_at', [$from, $to]);

        if (!empty($filters['referrer_id'])) {
            $q->join('acceptances', 'acceptances.invoice_id', '=', 'invoices.id')
              ->where('acceptances.referrer_id', $filters['referrer_id']);
        }

        $rows = $q->selectRaw('payments.paymentMethod as method,
                                COUNT(*)              as count,
                                ROUND(SUM(payments.price),3) as total')
            ->groupBy('payments.paymentMethod')
            ->orderByDesc('total')
            ->get();

        $grandTotal = $rows->sum('total');

        return $rows->map(fn($r) => [
            'method'  => $r->method,
            'total'   => (float) $r->total,
            'count'   => (int)   $r->count,
            'percent' => $grandTotal > 0 ? round(($r->total / $grandTotal) * 100, 1) : 0,
        ])->toArray();
    }
}
