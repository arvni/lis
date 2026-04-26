<?php

namespace App\Domains\Reception\Services;

use App\Domains\Laboratory\Enums\TestType;
use App\Domains\Reception\Enums\AcceptanceItemStateStatus;
use App\Domains\Reception\Models\AcceptanceItem;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class TATService
{
    // Days treated as weekend (Fri=5, Sat=6) — consistent with export logic
    private const WEEKEND_DAYS = [Carbon::FRIDAY, Carbon::SATURDAY];

    /**
     * Add N working days to a Carbon date, skipping Fri/Sat.
     */
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

    /**
     * Count elapsed working days between two Carbon dates.
     */
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

    /**
     * Return enriched TAT data for all active (non-reported) acceptance items.
     * Filters: priority, section_id, date_from, date_to
     */
    public function getItems(array $filters = []): Collection
    {
        $query = AcceptanceItem::query()
            ->with([
                'acceptance:id,priority,referenceCode',
                'acceptance.patient:id,fullName,idNo',
                'latestState.section:id,name',
                'test' => fn($q) => $q->select('tests.id', 'tests.name'),
                'method' => fn($q) => $q->select('methods.id', 'methods.name', 'methods.turnaround_time'),
            ])
            ->whereDoesntHave('report')
            ->whereHas('acceptance', fn($q) => $q->where('waiting_for_pooling', false))
            ->whereHas('test', fn($q) => $q->where('type', '!=', TestType::SERVICE->value));

        if (!empty($filters['priority'])) {
            $query->whereHas('acceptance', fn($q) => $q->where('priority', $filters['priority']));
        }

        if (!empty($filters['section_id'])) {
            $query->whereHas('latestState', fn($q) => $q->where('section_id', $filters['section_id']));
        }

        if (!empty($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }

        if (!empty($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }

        $now = Carbon::now();

        return $query->get()->map(function (AcceptanceItem $item) use ($now) {
            $tat = (int) ($item->method?->turnaround_time ?? 0);
            $createdAt = Carbon::parse($item->created_at);
            $deadline = $tat > 0 ? $this->addWorkingDays($createdAt, $tat) : null;
            $elapsed = $this->elapsedWorkingDays($createdAt, $now);
            $isFinished = $item->latestState?->status === AcceptanceItemStateStatus::FINISHED;
            $isBreached = $deadline && $now->gt($deadline) && !$isFinished;
            $progressPct = ($tat > 0 && $deadline) ? min(100, round(($elapsed / $tat) * 100)) : null;

            return [
                'id' => $item->id,
                'acceptance_id' => $item->acceptance_id,
                'reference_code' => $item->acceptance?->referenceCode,
                'patient_name' => $item->acceptance?->patient?->fullName,
                'patient_id_no' => $item->acceptance?->patient?->idNo,
                'test_name' => $item->test?->name,
                'method_name' => $item->method?->name,
                'section' => $item->latestState?->section?->name,
                'item_status' => $item->latestState?->status?->value,
                'priority' => $item->acceptance?->priority?->value ?? 'routine',
                'turnaround_time' => $tat,
                'created_at' => $item->created_at,
                'deadline' => $deadline?->toDateTimeString(),
                'elapsed_working_days' => $elapsed,
                'progress_pct' => $progressPct,
                'is_breached' => $isBreached,
                'is_at_risk' => !$isBreached && $progressPct !== null && $progressPct >= 70,
                'is_finished' => $isFinished,
            ];
        });
    }

    /**
     * Summary stats for the TAT dashboard cards.
     */
    public function getSummary(array $filters = []): array
    {
        $items = $this->getItems($filters);

        $active = $items->where('is_finished', false);
        $breached = $active->where('is_breached', true);
        $atRisk = $active->where('is_at_risk', true);
        $statActive = $active->where('priority', 'stat');

        // On-time completion: finished items within last 30 days
        $recentQuery = AcceptanceItem::query()
            ->whereHas('report')
            ->whereBetween('created_at', [Carbon::now()->subDays(30), Carbon::now()])
            ->with(['method' => fn($q) => $q->select('methods.id', 'methods.turnaround_time')]);

        $recentItems = $recentQuery->get();
        $totalRecent = $recentItems->count();
        $onTimeCount = 0;

        if ($totalRecent > 0) {
            $now = Carbon::now();
            foreach ($recentItems as $item) {
                $tat = (int) ($item->method?->turnaround_time ?? 0);
                if ($tat === 0) {
                    $onTimeCount++;
                    continue;
                }
                $deadline = $this->addWorkingDays(Carbon::parse($item->created_at), $tat);
                $reportedAt = Carbon::parse($item->updated_at);
                if ($reportedAt->lte($deadline)) {
                    $onTimeCount++;
                }
            }
        }

        $onTimePct = $totalRecent > 0 ? round(($onTimeCount / $totalRecent) * 100) : null;

        // Average elapsed working days per section for active items
        $bySection = $active
            ->whereNotNull('section')
            ->groupBy('section')
            ->map(fn($group) => [
                'section' => $group->first()['section'],
                'count' => $group->count(),
                'avg_elapsed' => round($group->avg('elapsed_working_days'), 1),
                'breached' => $group->where('is_breached', true)->count(),
            ])
            ->values();

        return [
            'total_active' => $active->count(),
            'breached' => $breached->count(),
            'at_risk' => $atRisk->count(),
            'stat_active' => $statActive->count(),
            'on_time_pct' => $onTimePct,
            'by_section' => $bySection,
        ];
    }
}
