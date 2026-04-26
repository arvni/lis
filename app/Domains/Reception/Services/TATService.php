<?php

namespace App\Domains\Reception\Services;

use App\Domains\Laboratory\Enums\TestType;
use App\Domains\Reception\Enums\AcceptanceItemStateStatus;
use App\Domains\Reception\Enums\AcceptanceStatus;
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

    // ── Shared acceptance constraint ──────────────────────────────────────────

    private function baseAcceptanceConstraint(): \Closure
    {
        return fn($q) => $q
            ->where('waiting_for_pooling', false)
            ->where('status', '!=', AcceptanceStatus::REPORTED->value);
    }

    // ── Base Eloquent query (no eager loads — cheap for count) ────────────────

    private function buildBaseQuery(array $filters): Builder
    {
        $query = AcceptanceItem::query()
            ->whereDoesntHave('report')
            ->whereHas('acceptance', $this->baseAcceptanceConstraint())
            ->whereHas('test', fn($q) => $q->where('type', '!=', TestType::SERVICE->value));

        if (!empty($filters['priority'])) {
            $query->whereHas('acceptance', fn($q) => $q->where('priority', $filters['priority']));
        }
        if (!empty($filters['section_id'])) {
            $query->whereHas('latestState', fn($q) => $q->where('section_id', $filters['section_id']));
        }
        if (!empty($filters['date_from'])) {
            $query->whereDate('acceptance_items.created_at', '>=', $filters['date_from']);
        }
        if (!empty($filters['date_to'])) {
            $query->whereDate('acceptance_items.created_at', '<=', $filters['date_to']);
        }
        return $query;
    }

    // ── Count only (used by the initial page render) ──────────────────────────

    public function getItemsCount(array $filters): int
    {
        return $this->buildBaseQuery($filters)->count();
    }

    // ── Paginated items (used by the API endpoint) ────────────────────────────

    public function getItemsPaginated(array $filters, int $page = 1, int $perPage = 20): array
    {
        $base = $this->buildBaseQuery($filters);

        $total = $base->count();

        $items = (clone $base)
            ->with([
                'acceptance:id,priority,referenceCode',
                'acceptance.patient:id,fullName,idNo',
                'latestState.section:id,name',
                'test'   => fn($q) => $q->select('tests.id', 'tests.name'),
                'method' => fn($q) => $q->select('methods.id', 'methods.name', 'methods.turnaround_time'),
            ])
            ->select('acceptance_items.*')
            ->selectSub(
                DB::table('acceptances')
                    ->whereColumn('id', 'acceptance_items.acceptance_id')
                    ->selectRaw("FIELD(priority, 'stat', 'urgent', 'routine')"),
                'priority_order'
            )
            ->orderBy('priority_order')
            ->orderBy('acceptance_items.created_at')
            ->offset(($page - 1) * $perPage)
            ->limit($perPage)
            ->get();

        $now = Carbon::now();
        $data = $items->map(fn($item) => $this->mapItem($item, $now))->values();

        return [
            'data' => $data,
            'meta' => [
                'total'        => $total,
                'per_page'     => $perPage,
                'current_page' => $page,
                'last_page'    => (int) ceil($total / max($perPage, 1)),
            ],
        ];
    }

    // ── Full collection (used by getSummary) ──────────────────────────────────

    public function getItems(array $filters = []): Collection
    {
        $items = $this->buildBaseQuery($filters)
            ->with([
                'acceptance:id,priority,referenceCode',
                'acceptance.patient:id,fullName,idNo',
                'latestState.section:id,name',
                'test'   => fn($q) => $q->select('tests.id', 'tests.name'),
                'method' => fn($q) => $q->select('methods.id', 'methods.name', 'methods.turnaround_time'),
            ])
            ->get();

        $now = Carbon::now();
        return $items->map(fn($item) => $this->mapItem($item, $now));
    }

    private function mapItem(AcceptanceItem $item, Carbon $now): array
    {
        $tat = (int) ($item->method?->turnaround_time ?? 0);
        $createdAt = Carbon::parse($item->created_at);
        $deadline = $tat > 0 ? $this->addWorkingDays($createdAt, $tat) : null;
        $elapsed = $this->elapsedWorkingDays($createdAt, $now);
        $isFinished = $item->latestState?->status === AcceptanceItemStateStatus::FINISHED;
        $isBreached = $deadline && $now->gt($deadline) && !$isFinished;
        $progressPct = ($tat > 0 && $deadline) ? min(100, round(($elapsed / $tat) * 100)) : null;

        return [
            'id'                   => $item->id,
            'acceptance_id'        => $item->acceptance_id,
            'reference_code'       => $item->acceptance?->referenceCode,
            'patient_name'         => $item->acceptance?->patient?->fullName,
            'patient_id_no'        => $item->acceptance?->patient?->idNo,
            'test_name'            => $item->test?->name,
            'method_name'          => $item->method?->name,
            'section'              => $item->latestState?->section?->name,
            'item_status'          => $item->latestState?->status?->value,
            'priority'             => $item->acceptance?->priority?->value ?? 'routine',
            'turnaround_time'      => $tat,
            'created_at'           => $item->created_at,
            'deadline'             => $deadline?->toDateTimeString(),
            'elapsed_working_days' => $elapsed,
            'progress_pct'         => $progressPct,
            'is_breached'          => $isBreached,
            'is_at_risk'           => !$isBreached && $progressPct !== null && $progressPct >= 70,
            'is_finished'          => $isFinished,
        ];
    }

    // ── Summary cards ─────────────────────────────────────────────────────────

    public function getSummary(array $filters = []): array
    {
        $items = $this->getItems($filters);
        $active = $items->where('is_finished', false);

        $onTimePct = $this->calcOnTimePct(Carbon::now()->subDays(30), Carbon::now());

        $bySection = $active
            ->whereNotNull('section')
            ->groupBy('section')
            ->map(fn($group) => [
                'section'     => $group->first()['section'],
                'count'       => $group->count(),
                'avg_elapsed' => round($group->avg('elapsed_working_days'), 1),
                'breached'    => $group->where('is_breached', true)->count(),
            ])
            ->values();

        return [
            'total_active' => $active->count(),
            'breached'     => $active->where('is_breached', true)->count(),
            'at_risk'      => $active->where('is_at_risk', true)->count(),
            'stat_active'  => $active->where('priority', 'stat')->count(),
            'on_time_pct'  => $onTimePct,
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
                DB::raw('COUNT(*) as count'),
                DB::raw('ROUND(AVG(TIMESTAMPDIFF(MINUTE, acceptance_items.created_at, reports.published_at)) / 60, 1) as avg_hours'),
                DB::raw('ROUND(MIN(TIMESTAMPDIFF(MINUTE, acceptance_items.created_at, reports.published_at)) / 60, 1) as min_hours'),
                DB::raw('ROUND(MAX(TIMESTAMPDIFF(MINUTE, acceptance_items.created_at, reports.published_at)) / 60, 1) as max_hours'),
                DB::raw('methods.turnaround_time as target_days')
            )
            ->groupBy('tests.id', 'tests.name', 'methods.turnaround_time')
            ->orderByDesc('avg_hours');

        if (!empty($filters['a_test_id'])) {
            $query->where('tests.id', $filters['a_test_id']);
        }

        return $query->get()->map(fn($row) => [
            'test_id'      => $row->test_id,
            'test_name'    => $row->test_name,
            'count'        => $row->count,
            'avg_hours'    => (float) $row->avg_hours,
            'avg_days'     => round($row->avg_hours / 24, 2),
            'min_hours'    => (float) $row->min_hours,
            'max_hours'    => (float) $row->max_hours,
            'target_hours' => $row->target_days ? $row->target_days * 24 : null,
            'on_target'    => $row->target_days
                ? round($row->avg_hours / 24, 2) <= $row->target_days
                : null,
        ])->toArray();
    }

    public function resolveAnalyticsDates(array $filters): array
    {
        $tz = 'Asia/Muscat';
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
            $deadline = $this->addWorkingDays(Carbon::parse($item->created_at), $tat);
            $publishedAt = $item->report?->published_at ? Carbon::parse($item->report->published_at) : null;
            return $publishedAt && $publishedAt->lte($deadline);
        })->count();

        return round(($onTime / $total) * 100);
    }
}
