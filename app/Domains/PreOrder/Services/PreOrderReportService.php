<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\Services;

use App\Domains\PreOrder\Enums\PreOrderStage;
use App\Domains\PreOrder\Enums\ReleasePurpose;
use App\Domains\PreOrder\Models\PreOrder;
use App\Domains\PreOrder\Models\PreOrderHistory;
use App\Domains\PreOrder\Models\PreOrderQuotation;
use App\Domains\PreOrder\Repositories\PreOrderReportRepository;
use App\Domains\PreOrder\Support\PreOrderBatches;
use Illuminate\Support\Carbon;

/**
 * The management reports: where open pre-orders sit, how long each stage takes, how fast
 * centers approve quotations, where cases drop off, and how many batches a PGT case needs.
 * Each report is a list of plain rows, so the page and the Excel export show the same thing.
 */
class PreOrderReportService
{
    public function __construct(private readonly PreOrderReportRepository $reports) {}

    /** @return array<string, list<array<string, mixed>>> */
    public function all(Carbon $from, Carbon $to): array
    {
        return [
            'by_stage' => $this->byStage(),
            'days_per_stage' => $this->daysPerStage($from, $to),
            'approval_time' => $this->approvalTime($from, $to),
            'drop_offs' => $this->dropOffs($from, $to),
            'pgt_batches' => $this->pgtBatches($from, $to),
        ];
    }

    /**
     * Open pre-orders by stage and flow family.

     *

     * @return list<array<string, mixed>>
     */
    public function byStage(): array
    {
        $rows = [];
        /** @var PreOrder $preOrder */
        foreach ($this->reports->open() as $preOrder) {
            $family = $preOrder->flow->family ?? 'no flow yet';
            $key = $preOrder->stage->value.'|'.$family;
            $rows[$key] ??= ['rank' => $preOrder->stage->rank(), 'stage' => $preOrder->stage->label(), 'family' => $family, 'count' => 0];
            $rows[$key]['count']++;
        }
        usort($rows, fn (array $a, array $b) => [$a['rank'], $a['family']] <=> [$b['rank'], $b['family']]);

        return array_map(fn (array $r) => ['stage' => $r['stage'], 'family' => $r['family'], 'count' => $r['count']], $rows);
    }

    /**
     * Average days spent in each stage by pre-orders started in the period.

     *

     * @return list<array<string, mixed>>
     */
    public function daysPerStage(Carbon $from, Carbon $to): array
    {
        /** @var array<int, list<PreOrderHistory>> $byCase */
        $byCase = [];
        /** @var PreOrderHistory $change */
        foreach ($this->reports->stageChanges($from, $to) as $change) {
            $byCase[$change->pre_order_id][] = $change;
        }

        $spans = [];
        foreach ($byCase as $changes) {
            foreach ($changes as $i => $change) {
                $stage = PreOrderStage::tryFrom((string) $change->to_stage);
                if ($stage === null || $stage->isFinal() || $change->created_at === null) {
                    continue;
                }
                // The current stage of an open case counts up to now; a closed case stopped when it closed.
                $end = isset($changes[$i + 1]) ? $changes[$i + 1]->created_at : ($change->preOrder->closed_at ?? null);
                $spans[$stage->value][] = $change->created_at->diffInHours($end ?? now(), true) / 24;
            }
        }

        $rows = [];
        foreach (PreOrderStage::cases() as $stage) {
            $days = $spans[$stage->value] ?? [];
            if ($days !== []) {
                $rows[] = [
                    'stage' => $stage->label(),
                    'cases' => count($days),
                    'average_days' => round(array_sum($days) / count($days), 1),
                    'longest_days' => round(max($days), 1),
                ];
            }
        }

        return $rows;
    }

    /**
     * How long each center took to decide on a quotation, and how.

     *

     * @return list<array<string, mixed>>
     */
    public function approvalTime(Carbon $from, Carbon $to): array
    {
        $rows = [];
        /** @var PreOrderQuotation $quotation */
        foreach ($this->reports->decidedQuotations($from, $to) as $quotation) {
            $center = $quotation->preOrder->referrer_id;
            $rows[$center] ??= ['center' => $quotation->preOrder->referrer->fullName ?? '—', 'quotations' => 0, 'approved' => 0, 'partially_approved' => 0, 'rejected' => 0, 'hours' => 0.0];
            $rows[$center]['quotations']++;
            $rows[$center][$quotation->status->value]++;
            $rows[$center]['hours'] += $quotation->created_at?->diffInHours($quotation->decided_at ?? now(), true) ?? 0.0;
        }
        usort($rows, fn (array $a, array $b) => $b['quotations'] <=> $a['quotations']);

        return array_map(function (array $r) {
            $r['average_hours'] = round($r['hours'] / $r['quotations'], 1);
            unset($r['hours']);

            return $r;
        }, $rows);
    }

    /**
     * Pre-orders that ended without results, by why and at which stage.

     *

     * @return list<array<string, mixed>>
     */
    public function dropOffs(Carbon $from, Carbon $to): array
    {
        $rows = [];
        /** @var PreOrder $preOrder */
        foreach ($this->reports->droppedOff($from, $to) as $preOrder) {
            $type = (string) ($preOrder->exception['type'] ?? '');
            $reason = (string) ($preOrder->exception['reason'] ?? '');
            $key = "$type|$reason|{$preOrder->stage->value}";
            $rows[$key] ??= ['outcome' => str_replace('_', ' ', $type), 'reason' => str_replace('_', ' ', $reason), 'stage' => $preOrder->stage->label(), 'count' => 0];
            $rows[$key]['count']++;
        }
        usort($rows, fn (array $a, array $b) => $b['count'] <=> $a['count']);

        return $rows;
    }

    /**
     * How many sample batches PGT cases needed (replacements included).

     *

     * @return list<array<string, mixed>>
     */
    public function pgtBatches(Carbon $from, Carbon $to): array
    {
        $cases = [];
        /** @var PreOrder $preOrder */
        foreach ($this->reports->pgtCases($from, $to) as $preOrder) {
            if ($preOrder->stage->rank() < PreOrderStage::BATCH_OPEN->rank()) {
                continue;
            }
            $batches = count(array_filter(PreOrderBatches::all($preOrder), fn (array $b) => in_array($b['purpose'], [ReleasePurpose::MAIN->value, ReleasePurpose::REPLACEMENT->value], true)));
            $cases[$batches] = ($cases[$batches] ?? 0) + 1;
        }
        ksort($cases);

        return array_map(fn (int $batches, int $count) => ['batches' => $batches, 'cases' => $count], array_keys($cases), array_values($cases));
    }
}
