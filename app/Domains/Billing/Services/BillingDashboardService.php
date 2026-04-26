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

    // ── Shared base query (acceptance_items joined to acceptances + invoices) ─

    private function baseQuery(array $filters, Carbon $from, Carbon $to)
    {
        $q = DB::table('acceptance_items')
            ->join('acceptances', 'acceptances.id', '=', 'acceptance_items.acceptance_id')
            ->leftJoin('invoices', 'invoices.id', '=', 'acceptances.invoice_id')
            ->whereNull('acceptance_items.deleted_at')
            ->where('acceptances.status', '!=', 'Canceled')
            ->whereBetween('acceptances.created_at', [$from, $to]);

        if (!empty($filters['referrer_id'])) {
            $q->where('acceptances.referrer_id', $filters['referrer_id']);
        }

        // has_invoice: '1' = invoiced, '0' = not invoiced
        if (isset($filters['has_invoice']) && $filters['has_invoice'] !== '') {
            if ($filters['has_invoice'] === '1' || $filters['has_invoice'] === true) {
                $q->whereNotNull('acceptances.invoice_id');
            } else {
                $q->whereNull('acceptances.invoice_id');
            }
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

        // Payments in the same window (join via acceptance → invoice → payment)
        $paymentsQ = DB::table('payments')
            ->join('invoices', 'invoices.id', '=', 'payments.invoice_id')
            ->join('acceptances', 'acceptances.invoice_id', '=', 'invoices.id')
            ->where('acceptances.status', '!=', 'Canceled')
            ->whereBetween('acceptances.created_at', [$from, $to]);

        if (!empty($filters['referrer_id'])) {
            $paymentsQ->where('acceptances.referrer_id', $filters['referrer_id']);
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
    // Filters: t_has_invoice ('1'=use invoice date, else acceptance date),
    //          t_referrer_id, t_test_id, t_months (default 12, max 36)

    public function getByMonth(array $filters): array
    {
        $tz     = 'Asia/Muscat';
        $months = max(1, min(36, (int) ($filters['t_months'] ?? 12)));
        $useInvoiceDate = ($filters['t_has_invoice'] ?? '') === '1';

        $dateCol = $useInvoiceDate ? 'invoices.created_at' : 'acceptances.created_at';
        $from    = Carbon::now($tz)->subMonths($months)->startOfMonth();
        $to      = Carbon::now($tz)->endOfMonth();

        $q = DB::table('acceptance_items')
            ->join('acceptances', 'acceptances.id', '=', 'acceptance_items.acceptance_id')
            ->leftJoin('invoices', 'invoices.id', '=', 'acceptances.invoice_id')
            ->whereNull('acceptance_items.deleted_at')
            ->where('acceptances.status', '!=', 'Canceled')
            ->whereBetween($dateCol, [$from, $to]);

        if ($useInvoiceDate) {
            $q->whereNotNull('acceptances.invoice_id');
        } elseif (($filters['t_has_invoice'] ?? '') === '0') {
            $q->whereNull('acceptances.invoice_id');
        }

        if (!empty($filters['t_referrer_id'])) {
            $q->where('acceptances.referrer_id', $filters['t_referrer_id']);
        }

        if (!empty($filters['t_test_id'])) {
            $q->join('method_tests', 'method_tests.id', '=', 'acceptance_items.method_test_id')
              ->where('method_tests.test_id', $filters['t_test_id']);
        }

        $rows = $q->selectRaw("
                YEAR({$dateCol})                                                       AS year,
                MONTH({$dateCol})                                                      AS month,
                DATE_FORMAT({$dateCol}, '%Y-%m')                                       AS period,
                ROUND(SUM(acceptance_items.price - acceptance_items.discount), 3)      AS income,
                COUNT(DISTINCT acceptances.id)                                         AS acceptance_count
            ")
            ->groupByRaw("year, month, period")
            ->orderByRaw("year, month")
            ->get();

        // Fill gaps so the chart has a point for every month in range
        $map = $rows->keyBy('period');
        $result = [];
        $cursor = $from->copy()->startOfMonth();
        while ($cursor->lte($to)) {
            $key = $cursor->format('Y-m');
            $row = $map->get($key);
            $result[] = [
                'period'           => $key,
                'label'            => $cursor->format('M Y'),
                'year'             => (int) $cursor->year,
                'month'            => (int) $cursor->month,
                'income'           => (float) ($row->income ?? 0),
                'acceptance_count' => (int)   ($row->acceptance_count ?? 0),
            ];
            $cursor->addMonth();
        }
        return $result;
    }

    // ── Income by test ────────────────────────────────────────────────────────
    // Panel items: price may be unevenly stored across constituent items.
    // We compute the panel total first (all items sharing the same panel_id),
    // then attribute panel_total / distinct_tests to each test in the panel.
    // Non-panel items use their own price - discount directly.

    public function getByTest(array $filters): array
    {
        [$from, $to] = $this->resolveDates($filters);

        // Subquery: per-panel totals using the same base filters
        $panelTotals = (clone $this->baseQuery($filters, $from, $to))
            ->whereNotNull('acceptance_items.panel_id')
            ->selectRaw('
                acceptance_items.panel_id                                       AS panel_id,
                SUM(acceptance_items.price - acceptance_items.discount)         AS panel_total,
                COUNT(DISTINCT acceptance_items.method_test_id)                 AS distinct_tests
            ')
            ->groupBy('acceptance_items.panel_id');

        $rows = (clone $this->baseQuery($filters, $from, $to))
            ->join('method_tests', 'method_tests.id', '=', 'acceptance_items.method_test_id')
            ->join('tests',        'tests.id',        '=', 'method_tests.test_id')
            ->leftJoinSub($panelTotals, 'pt', 'pt.panel_id', '=', 'acceptance_items.panel_id')
            ->selectRaw('
                tests.id                                                        AS test_id,
                tests.name                                                      AS test_name,
                COUNT(*)                                                        AS count,
                ROUND(SUM(
                    CASE WHEN acceptance_items.panel_id IS NULL
                         THEN acceptance_items.price - acceptance_items.discount
                         ELSE pt.panel_total / pt.distinct_tests
                    END
                ), 3)                                                           AS income
            ')
            ->groupBy('tests.id', 'tests.name')
            ->orderByDesc('income')
            ->limit(25)
            ->get();

        return $rows->map(fn($r) => [
            'name'   => $r->test_name,
            'income' => (float) $r->income,
            'count'  => (int)   $r->count,
        ])->toArray();
    }

    // ── Income by referrer ────────────────────────────────────────────────────

    public function getByReferrer(array $filters): array
    {
        [$from, $to] = $this->resolveDates($filters);

        $rows = (clone $this->baseQuery($filters, $from, $to))
            ->leftJoin('referrers', 'referrers.id', '=', 'acceptances.referrer_id')
            ->selectRaw("COALESCE(referrers.fullName, 'Direct')                            as referrer_name,
                          COUNT(DISTINCT acceptances.id)                                    as acceptance_count,
                          ROUND(SUM(acceptance_items.price - acceptance_items.discount),3)  as income")
            ->groupBy('acceptances.referrer_id', 'referrers.fullName')
            ->orderByDesc('income')
            ->limit(20)
            ->get();

        return $rows->map(fn($r) => [
            'name'             => $r->referrer_name,
            'income'           => (float) $r->income,
            'acceptance_count' => (int)   $r->acceptance_count,
        ])->toArray();
    }

    // ── Payments by method ────────────────────────────────────────────────────

    public function getByPaymentMethod(array $filters): array
    {
        [$from, $to] = $this->resolveDates($filters);

        $q = DB::table('payments')
            ->join('invoices',    'invoices.id',            '=', 'payments.invoice_id')
            ->join('acceptances', 'acceptances.invoice_id', '=', 'invoices.id')
            ->where('acceptances.status', '!=', 'Canceled')
            ->whereBetween('acceptances.created_at', [$from, $to]);

        if (!empty($filters['referrer_id'])) {
            $q->where('acceptances.referrer_id', $filters['referrer_id']);
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
