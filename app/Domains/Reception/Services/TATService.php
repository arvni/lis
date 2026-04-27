<?php

namespace App\Domains\Reception\Services;

use App\Domains\Laboratory\Enums\TestType;
use App\Domains\Reception\Enums\AcceptanceItemStateStatus;
use App\Domains\Reception\Enums\AcceptanceStatus;
use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Models\AcceptanceItem;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class TATService
{
    private const WEEKEND_DAYS = [Carbon::FRIDAY, Carbon::SATURDAY];

    // ── Working-day helpers ───────────────────────────────────────────────────

    public function addWorkingDays(Carbon $date, int $days): Carbon
    {
        $result = $date->copy();
        $remaining = $days;
        while ($remaining > 0) {
            $result->addDay();
            if (!in_array($result->dayOfWeek, self::WEEKEND_DAYS)) {
                $remaining--;
            }
        }
        return $result;
    }

    public function elapsedWorkingDays(Carbon $from, Carbon $to): int
    {
        $count = 0;
        $cursor = $from->copy()->startOfDay();
        $end = $to->copy()->startOfDay();
        while ($cursor->lt($end)) {
            $cursor->addDay();
            if (!in_array($cursor->dayOfWeek, self::WEEKEND_DAYS)) {
                $count++;
            }
        }
        return $count;
    }

    // ── Base acceptance query ─────────────────────────────────────────────────
    // An acceptance is "active" for TAT purposes when:
    //   • not waiting for pooling
    //   • not in reported / cancelled status
    //   • has at least one unreported non-SERVICE item

    private function buildBaseQuery(array $filters): Builder
    {
        $query = Acceptance::query()
            ->where('waiting_for_pooling', false)
            ->whereNotIn('status', [
                AcceptanceStatus::REPORTED->value,
                AcceptanceStatus::CANCELLED->value,
            ])
            ->whereHas('acceptanceItems', fn($q) => $q
                ->whereDoesntHave('report')
                ->whereHas('test', fn($tq) => $tq->where('type', '!=', TestType::SERVICE->value))
            );

        if (!empty($filters['priority'])) {
            $query->where('priority', $filters['priority']);
        }
        if (!empty($filters['section_id'])) {
            $query->whereHas('acceptanceItemStates', fn($q) => $q->where('section_id', $filters['section_id']));
        }
        if (!empty($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }
        if (!empty($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }

        return $query;
    }

    // ── Eager-load spec for active items per acceptance ───────────────────────

    private function activeItemsWith(): array
    {
        return [
            'acceptanceItems' => fn($q) => $q
                ->whereDoesntHave('report')
                ->whereHas('test', fn($tq) => $tq->where('type', '!=', TestType::SERVICE->value))
                ->with([
                    'test'        => fn($tq) => $tq->select('tests.id', 'tests.name'),
                    'method'      => fn($mq) => $mq->select('methods.id', 'methods.name', 'methods.turnaround_time'),
                    'latestState' => fn($sq) => $sq->with('section:id,name'),
                ]),
        ];
    }

    // ── Count only ────────────────────────────────────────────────────────────

    public function getItemsCount(array $filters): int
    {
        return $this->buildBaseQuery($filters)->count();
    }

    // ── Paginated (API) ───────────────────────────────────────────────────────

    public function getItemsPaginated(array $filters, int $page = 1, int $perPage = 20): array
    {
        $base = $this->buildBaseQuery($filters);
        $total = $base->count();

        $acceptances = (clone $base)
            ->with(['patient:id,fullName,idNo', ...$this->activeItemsWith()])
            ->select('acceptances.*')
            ->selectSub(
                DB::table('acceptances as _a')
                    ->whereColumn('_a.id', 'acceptances.id')
                    ->selectRaw("FIELD(_a.priority, 'stat', 'urgent', 'routine')"),
                'priority_order'
            )
            ->orderBy('priority_order')
            ->orderByDesc('acceptances.created_at')
            ->offset(($page - 1) * $perPage)
            ->limit($perPage)
            ->get();

        $now = Carbon::now();

        return [
            'data' => $acceptances->map(fn($a) => $this->mapAcceptance($a, $now))->values(),
            'meta' => [
                'total'        => $total,
                'per_page'     => $perPage,
                'current_page' => $page,
                'last_page'    => (int) ceil($total / max($perPage, 1)),
            ],
        ];
    }

    // ── Full collection (for summary cards) ───────────────────────────────────

    public function getItems(array $filters = []): Collection
    {
        $acceptances = $this->buildBaseQuery($filters)
            ->with(['patient:id,fullName,idNo', ...$this->activeItemsWith()])
            ->get();

        $now = Carbon::now();
        return $acceptances->map(fn($a) => $this->mapAcceptance($a, $now));
    }

    // ── Map one acceptance to TAT data ────────────────────────────────────────

    private function mapAcceptance(Acceptance $acceptance, Carbon $now): array
    {
        $items = $acceptance->acceptanceItems;

        // TAT start = datetime of the LAST item added to this acceptance
        $lastItemAt = $items->max('created_at');
        $startTime  = $lastItemAt ? Carbon::parse($lastItemAt) : Carbon::parse($acceptance->created_at);

        // TAT = max turnaround_time across all active items
        $maxTat = (int) $items->max(fn($i) => $i->method?->turnaround_time ?? 0);

        $deadline    = $maxTat > 0 ? $this->addWorkingDays($startTime, $maxTat) : null;
        $elapsed     = $this->elapsedWorkingDays($startTime, $now);
        $isBreached  = $deadline && $now->gt($deadline);
        $progressPct = ($maxTat > 0 && $deadline) ? min(100, round(($elapsed / $maxTat) * 100)) : null;

        $statuses  = $items->map(fn($i) => $i->latestState?->status?->value)->filter()->unique()->values();
        $sections = $items->map(fn($i) => $i->latestState?->section)
            ->filter()
            ->unique('id')
            ->map(fn($s) => ['id' => $s->id, 'name' => $s->name])
            ->values();
        $testNames = $items->map(fn($i) => $i->test?->name)->filter()->unique()->values();

        return [
            'id'                   => $acceptance->id,
            'reference_code'       => $acceptance->referenceCode,
            'patient_name'         => $acceptance->patient?->fullName,
            'patient_id_no'        => $acceptance->patient?->idNo,
            'tests'                => $testNames,
            'sections'             => $sections,
            'statuses'             => $statuses,
            'priority'             => $acceptance->priority?->value ?? 'routine',
            'max_tat'              => $maxTat,
            'start_time'           => $startTime->toDateTimeString(),
            'deadline'             => $deadline?->toDateTimeString(),
            'elapsed_working_days' => $elapsed,
            'progress_pct'         => $progressPct,
            'is_breached'          => $isBreached,
            'is_at_risk'           => !$isBreached && $progressPct !== null && $progressPct >= 70,
            'active_items_count'   => $items->count(),
        ];
    }

    // ── Summary cards ─────────────────────────────────────────────────────────

    public function getSummary(array $filters = []): array
    {
        $rows = $this->getItems($filters);

        $bySection = $rows
            ->flatMap(fn($r) => collect($r['sections'])->map(fn($s) => ['section_id' => $s['id'], 'section' => $s['name'], 'row' => $r]))
            ->groupBy('section')
            ->map(fn($group) => [
                'section_id'  => $group->first()['section_id'],
                'section'     => $group->first()['section'],
                'count'       => $group->count(),
                'avg_elapsed' => round($group->avg(fn($g) => $g['row']['elapsed_working_days']), 1),
                'breached'    => $group->filter(fn($g) => $g['row']['is_breached'])->count(),
            ])
            ->values();

        return [
            'total_active' => $rows->count(),
            'breached'     => $rows->where('is_breached', true)->count(),
            'at_risk'      => $rows->where('is_at_risk', true)->count(),
            'stat_active'  => $rows->where('priority', 'stat')->count(),
            'on_time_pct'  => $this->calcOnTimePct(Carbon::now()->subDays(30), Carbon::now()),
            'by_section'   => $bySection,
        ];
    }

    // ── Per-test analytics ────────────────────────────────────────────────────

    public function getTestAnalytics(array $filters = []): array
    {
        [$from, $to] = $this->resolveAnalyticsDates($filters);

        $query = DB::table('acceptance_items')
            ->join('method_tests', 'method_tests.id', '=', 'acceptance_items.method_test_id')
            ->join('tests', 'tests.id', '=', 'method_tests.test_id')
            ->join('methods', 'methods.id', '=', 'method_tests.method_id')
            ->join('reports', 'reports.acceptance_item_id', '=', 'acceptance_items.id')
            ->join('acceptances', 'acceptances.id', '=', 'acceptance_items.acceptance_id')
            ->whereNull('acceptance_items.deleted_at')
            ->whereNotNull('reports.published_at')
            ->where('tests.type', '!=', TestType::SERVICE->value)
            ->where('acceptances.waiting_for_pooling', false)
            ->whereBetween('acceptance_items.created_at', [$from->copy()->startOfDay(), $to->copy()->endOfDay()])
            ->select(
                'tests.id as test_id',
                'tests.name as test_name',
                'methods.turnaround_time as target_days',
                'acceptance_items.created_at as item_created_at',
                'reports.published_at as report_published_at'
            );

        if (!empty($filters['a_test_id'])) {
            $query->where('tests.id', $filters['a_test_id']);
        }

        return $query->get()
            ->groupBy('test_id')
            ->map(function ($items) {
                $first = $items->first();

                $workingDays = $items->map(fn($item) =>
                    $this->elapsedWorkingDays(
                        Carbon::parse($item->item_created_at),
                        Carbon::parse($item->report_published_at)
                    )
                );

                $avgDays    = round($workingDays->avg(), 1);
                $targetDays = $first->target_days ? (int) $first->target_days : null;

                return [
                    'test_id'     => $first->test_id,
                    'test_name'   => $first->test_name,
                    'count'       => $items->count(),
                    'avg_days'    => $avgDays,
                    'min_days'    => $workingDays->min(),
                    'max_days'    => $workingDays->max(),
                    'target_days' => $targetDays,
                    'on_target'   => $targetDays !== null ? $avgDays <= $targetDays : null,
                ];
            })
            ->sortByDesc('avg_days')
            ->values()
            ->toArray();
    }

    public function resolveAnalyticsDates(array $filters): array
    {
        $tz  = 'Asia/Muscat';
        $now = Carbon::now($tz);

        return match ($filters['a_preset'] ?? null) {
            'today'         => [$now->copy()->startOfDay(), $now->copy()->endOfDay()],
            'this_week'     => [$now->copy()->startOfWeek(), $now->copy()->endOfWeek()],
            'last_week'     => [$now->copy()->subWeek()->startOfWeek(), $now->copy()->subWeek()->endOfWeek()],
            'this_month'    => [$now->copy()->startOfMonth(), $now->copy()->endOfMonth()],
            'last_month'    => [$now->copy()->subMonth()->startOfMonth(), $now->copy()->subMonth()->endOfMonth()],
            'last_7_days'   => [$now->copy()->subDays(7), $now],
            'last_30_days'  => [$now->copy()->subDays(30), $now],
            'last_3_months' => [$now->copy()->subMonths(3), $now],
            default         => [
                !empty($filters['a_from']) ? Carbon::parse($filters['a_from'], $tz)->startOfDay() : $now->copy()->subDays(30),
                !empty($filters['a_to'])   ? Carbon::parse($filters['a_to'], $tz)->endOfDay()     : $now,
            ],
        };
    }

    private function calcOnTimePct(Carbon $from, Carbon $to): ?int
    {
        $items = AcceptanceItem::query()
            ->whereHas('report')
            ->whereHas('test', fn($q) => $q->where('type', '!=', TestType::SERVICE->value))
            ->whereBetween('created_at', [$from, $to])
            ->with([
                'method' => fn($q) => $q->select('methods.id', 'methods.turnaround_time'),
                'report:id,acceptance_item_id,published_at',
            ])
            ->get();

        $total = $items->count();
        if ($total === 0) return null;

        $onTime = $items->filter(function (AcceptanceItem $item) {
            $tat = (int) ($item->method?->turnaround_time ?? 0);
            if ($tat === 0) return true;
            $deadline    = $this->addWorkingDays(Carbon::parse($item->created_at), $tat);
            $publishedAt = $item->report?->published_at ? Carbon::parse($item->report->published_at) : null;
            return $publishedAt && $publishedAt->lte($deadline);
        })->count();

        return round(($onTime / $total) * 100);
    }
}
