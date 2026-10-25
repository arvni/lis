<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\Repositories;

use App\Domains\PreOrder\Enums\FinanceStatus;
use App\Domains\PreOrder\Enums\HistoryType;
use App\Domains\PreOrder\Models\PreOrder;
use App\Domains\PreOrder\Models\PreOrderHistory;
use App\Domains\PreOrder\Models\PreOrderQuotation;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Carbon;

/** The rows the pre-order reports are computed from. */
class PreOrderReportRepository
{
    /**
     * Open pre-orders with their flow's family.
     *
     * @return Collection<int, PreOrder>
     */
    public function open(): Collection
    {
        return PreOrder::query()->whereNull('closed_at')->with('flow:id,family')->get(['id', 'stage', 'flow_id']);
    }

    /**
     * Stage changes of the pre-orders started in the period, oldest first.

     *

     * @return Collection<int, PreOrderHistory>
     */
    public function stageChanges(Carbon $from, Carbon $to): Collection
    {
        return PreOrderHistory::query()
            ->where('type', HistoryType::STAGE->value)
            ->whereIn('pre_order_id', PreOrder::query()->whereBetween('created_at', [$from, $to])->select('id'))
            ->with('preOrder:id,closed_at')
            ->orderBy('pre_order_id')
            ->orderBy('id')
            ->get(['id', 'pre_order_id', 'to_stage', 'created_at']);
    }

    /**
     * Quotations the centers decided on in the period.

     *

     * @return Collection<int, PreOrderQuotation>
     */
    public function decidedQuotations(Carbon $from, Carbon $to): Collection
    {
        return PreOrderQuotation::query()
            ->whereBetween('decided_at', [$from, $to])
            ->whereIn('status', [FinanceStatus::APPROVED->value, FinanceStatus::PARTIALLY_APPROVED->value, FinanceStatus::REJECTED->value])
            ->with('preOrder:id,referrer_id', 'preOrder.referrer:id,fullName')
            ->get(['id', 'pre_order_id', 'status', 'created_at', 'decided_at']);
    }

    /**
     * Pre-orders that ended without results in the period.

     *

     * @return Collection<int, PreOrder>
     */
    public function droppedOff(Carbon $from, Carbon $to): Collection
    {
        return PreOrder::query()
            ->whereBetween('closed_at', [$from, $to])
            ->whereNotNull('exception')
            ->with('flow:id,family')
            ->get(['id', 'stage', 'flow_id', 'exception']);
    }

    /**
     * PGT pre-orders started in the period that reached the samples stage, with what batches need.

     *

     * @return Collection<int, PreOrder>
     */
    public function pgtCases(Carbon $from, Carbon $to): Collection
    {
        return PreOrder::query()
            ->whereBetween('created_at', [$from, $to])
            ->whereHas('flow', fn ($q) => $q->whereIn('family', ['pgt_a', 'pgt_m']))
            ->with('items:id,pre_order_id,status,release_key,release_purpose', 'flow:id,family')
            ->get(['id', 'code', 'flow_id', 'batches', 'stage']);
    }
}
