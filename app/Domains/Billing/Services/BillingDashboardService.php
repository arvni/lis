<?php

namespace App\Domains\Billing\Services;

use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class BillingDashboardService
{
    // ── Date preset resolver ──────────────────────────────────────────────────

    public function resolveDates(array $filters): array
    {
        $tz  = 'Asia/Muscat';
        $now = Carbon::now($tz);

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
                !empty($filters['from']) ? Carbon::parse($filters['from'], $tz)->startOfDay() : $now->copy()->subDays(30),
                !empty($filters['to'])   ? Carbon::parse($filters['to'],   $tz)->endOfDay()   : $now,
            ],
        };
    }

    // ── Shared base query ─────────────────────────────────────────────────────
    // Date rules (acceptances.created_at is never used):
    //   Invoiced items   → date = invoices.created_at
    //   Non-invoiced items → date = acceptance_items.created_at
    // has_invoice filter:
    //   '1'  → invoiced only  (invoices.created_at in range)
    //   '0'  → non-invoiced   (acceptance_items.created_at in range)
    //   ''   → both (composite OR)

    private function baseQuery(array $filters, Carbon $from, Carbon $to)
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
            // Both: invoiced row in range OR non-invoiced row in range
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

        $revenue = (clone $this->baseQuery($filters, $from, $to))
            ->selectRaw('SUM(acceptance_items.price - acceptance_items.discount) as revenue,
                          COUNT(DISTINCT acceptances.id)                          as acceptance_count,
                          COUNT(DISTINCT acceptances.invoice_id)                  as invoice_count')
            ->first();

        // Payments: filter by invoice creation date (not acceptance date)
        $paymentsQ = DB::table('payments')
            ->join('invoices', 'invoices.id', '=', 'payments.invoice_id')
            ->whereBetween('invoices.created_at', [$from, $to]);

        if (!empty($filters['referrer_id'])) {
            $paymentsQ->join('acceptances', 'acceptances.invoice_id', '=', 'invoices.id')
                      ->where('acceptances.referrer_id', $filters['referrer_id']);
        }
        if (!empty($filters['payment_method'])) {
            $paymentsQ->where('payments.paymentMethod', $filters['payment_method']);
        }

        $collected = (float) $paymentsQ->sum('payments.price');
        $totalRevenue = (float) ($revenue->revenue ?? 0);

        return [
            'revenue'          => round($totalRevenue, 3),
            'collected'        => round($collected, 3),
            'outstanding'      => round($totalRevenue - $collected, 3),
            'acceptance_count' => (int) ($revenue->acceptance_count ?? 0),
            'invoice_count'    => (int) ($revenue->invoice_count ?? 0),
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
        $tz    = 'Asia/Muscat';
        $months = max(1, min(36, (int) ($filters['t_months'] ?? 12)));
        $from  = Carbon::now($tz)->subMonths($months)->startOfMonth();
        $to    = Carbon::now($tz)->endOfMonth();

        $trendTestIds = array_filter((array) ($filters['t_test_id'] ?? []));

        // Helper closure to apply referrer + test filters
        $applyCommon = function ($q) use ($filters, $trendTestIds) {
            if (!empty($filters['t_referrer_id'])) {
                $q->where('acceptances.referrer_id', $filters['t_referrer_id']);
            }
            if (!empty($trendTestIds)) {
                $q->whereExists(fn($sub) => $sub
                    ->from('method_tests')
                    ->whereColumn('method_tests.id', 'acceptance_items.method_test_id')
                    ->whereIn('method_tests.test_id', $trendTestIds)
                );
            }
        };

        // ① Invoiced — grouped by invoice creation month
        $invQuery = DB::table('acceptance_items')
            ->join('acceptances', 'acceptances.id', '=', 'acceptance_items.acceptance_id')
            ->join('invoices',    'invoices.id',    '=', 'acceptances.invoice_id')
            ->whereNull('acceptance_items.deleted_at')
            ->where('acceptances.status', '!=', 'Canceled')
            ->whereBetween('invoices.created_at', [$from, $to]);
        $applyCommon($invQuery);
        $invoicedMap = $invQuery
            ->selectRaw("DATE_FORMAT(invoices.created_at, '%Y-%m') AS period,
                          ROUND(SUM(acceptance_items.price - acceptance_items.discount),3) AS income")
            ->groupBy('period')
            ->get()
            ->keyBy('period');

        // ② Non-invoiced — grouped by acceptance_item creation month
        $nonInvQuery = DB::table('acceptance_items')
            ->join('acceptances', 'acceptances.id', '=', 'acceptance_items.acceptance_id')
            ->whereNull('acceptance_items.deleted_at')
            ->whereNull('acceptances.invoice_id')
            ->where('acceptances.status', '!=', 'Canceled')
            ->whereBetween('acceptance_items.created_at', [$from, $to]);
        $applyCommon($nonInvQuery);
        $nonInvoicedMap = $nonInvQuery
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
                'invoiced_income'     => (float) ($invoicedMap->get($key)?->income ?? 0),
                'non_invoiced_income' => (float) ($nonInvoicedMap->get($key)?->income ?? 0),
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

        // Panel subquery: split invoice totals per panel_id
        $panelTotals = (clone $this->baseQuery($f, $from, $to))
            ->whereNotNull('acceptance_items.panel_id')
            ->selectRaw('
                acceptance_items.panel_id AS panel_id,
                COUNT(DISTINCT acceptance_items.method_test_id) AS distinct_tests,
                SUM(CASE WHEN acceptances.invoice_id IS NOT NULL
                         THEN acceptance_items.price - acceptance_items.discount ELSE 0 END) AS inv_total,
                SUM(CASE WHEN acceptances.invoice_id IS NULL
                         THEN acceptance_items.price - acceptance_items.discount ELSE 0 END) AS non_inv_total
            ')
            ->groupBy('acceptance_items.panel_id');

        $rows = (clone $this->baseQuery($f, $from, $to))
            ->join('method_tests', 'method_tests.id', '=', 'acceptance_items.method_test_id')
            ->join('tests',        'tests.id',        '=', 'method_tests.test_id')
            ->leftJoinSub($panelTotals, 'pt', 'pt.panel_id', '=', 'acceptance_items.panel_id')
            ->selectRaw('
                tests.id   AS test_id,
                tests.name AS test_name,
                COUNT(*)   AS count,
                ROUND(SUM(CASE WHEN acceptance_items.panel_id IS NULL
                               THEN (CASE WHEN acceptances.invoice_id IS NOT NULL
                                         THEN acceptance_items.price - acceptance_items.discount ELSE 0 END)
                               ELSE pt.inv_total / pt.distinct_tests END), 3) AS invoiced_income,
                ROUND(SUM(CASE WHEN acceptance_items.panel_id IS NULL
                               THEN (CASE WHEN acceptances.invoice_id IS NULL
                                         THEN acceptance_items.price - acceptance_items.discount ELSE 0 END)
                               ELSE pt.non_inv_total / pt.distinct_tests END), 3) AS non_invoiced_income
            ')
            ->groupBy('tests.id', 'tests.name')
            ->orderByRaw('SUM(CASE WHEN acceptance_items.panel_id IS NULL
                              THEN acceptance_items.price - acceptance_items.discount
                              ELSE (pt.inv_total + pt.non_inv_total) / pt.distinct_tests END) DESC')
            ->limit(25)
            ->get();

        return $rows->map(fn($r) => [
            'name'               => $r->test_name,
            'invoiced_income'    => (float) $r->invoiced_income,
            'non_invoiced_income'=> (float) $r->non_invoiced_income,
            'count'              => (int)   $r->count,
        ])->toArray();
    }

    // ── Income by referrer ────────────────────────────────────────────────────

    public function getByReferrer(array $filters): array
    {
        [$from, $to] = $this->resolveDates($filters);
        $f = array_merge($filters, ['has_invoice' => '']);

        $rows = (clone $this->baseQuery($f, $from, $to))
            ->leftJoin('referrers', 'referrers.id', '=', 'acceptances.referrer_id')
            ->selectRaw("
                COALESCE(referrers.fullName, 'Direct')                                          AS referrer_name,
                COUNT(DISTINCT acceptances.id)                                                  AS acceptance_count,
                ROUND(SUM(CASE WHEN acceptances.invoice_id IS NOT NULL
                               THEN acceptance_items.price - acceptance_items.discount ELSE 0 END),3) AS invoiced_income,
                ROUND(SUM(CASE WHEN acceptances.invoice_id IS NULL
                               THEN acceptance_items.price - acceptance_items.discount ELSE 0 END),3) AS non_invoiced_income
            ")
            ->groupBy('acceptances.referrer_id', 'referrers.fullName')
            ->orderByRaw('SUM(acceptance_items.price - acceptance_items.discount) DESC')
            ->limit(20)
            ->get();

        return $rows->map(fn($r) => [
            'name'                => $r->referrer_name,
            'invoiced_income'     => (float) $r->invoiced_income,
            'non_invoiced_income' => (float) $r->non_invoiced_income,
            'acceptance_count'    => (int)   $r->acceptance_count,
        ])->toArray();
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
