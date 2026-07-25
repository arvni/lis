<?php

declare(strict_types=1);

namespace App\Domains\Inventory\Repositories;

use App\Domains\Inventory\Enums\StockExportRequestStatus;
use App\Domains\Inventory\Models\StockExportRequest;
use App\Domains\Inventory\Models\StockExportRequestFulfillment;
use App\Domains\Inventory\Models\StockExportRequestFulfillmentLine;
use App\Domains\Inventory\Models\StockExportRequestHistory;
use App\Domains\Inventory\Models\StockExportRequestLine;
use App\Domains\User\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

class StockExportRequestRepository
{
    /**
     * Paginated export requests for the index screen, scoped by view:
     * 'mine' (default) — requests the user created; 'approval' — workflow requests
     * awaiting the user's action; 'all' — union of both.
     *
     * @return LengthAwarePaginator<int, StockExportRequest>
     */
    public function listForUser(User $user, array $filters): LengthAwarePaginator
    {
        $view = $filters['filters']['view'] ?? 'mine';
        $status = $filters['filters']['status'] ?? '';
        $urgency = $filters['filters']['urgency'] ?? '';

        $query = StockExportRequest::with(['requestedBy', 'store', 'lines.item', 'lines.unit'])
            ->withCount('lines')
            ->orderBy('created_at', 'desc');

        if ($view === 'approval') {
            $query->where('status', StockExportRequestStatus::SUBMITTED)
                ->whereHas('approvals', fn ($sub) => $this->scopeActiveApproverQuery($sub, $user));
        } elseif ($view === 'all') {
            $query->where(function ($q) use ($user) {
                $q->where('requested_by_user_id', $user->id)
                    ->orWhere(function ($sub) use ($user) {
                        $sub->where('status', StockExportRequestStatus::SUBMITTED)
                            ->whereHas('approvals', fn ($s) => $this->scopeActiveApproverQuery($s, $user));
                    });
            });
        } else {
            $query->where('requested_by_user_id', $user->id);
        }

        if ($status !== '') {
            $query->where('status', $status);
        }
        if ($urgency !== '') {
            $query->where('urgency', $urgency);
        }

        return $query->paginate((int) ($filters['pageSize'] ?? 15));
    }

    /**
     * How many submitted export requests are waiting on this user's approval.
     */
    public function countPendingApprovalFor(User $user): int
    {
        return StockExportRequest::where('status', StockExportRequestStatus::SUBMITTED)
            ->whereHas('approvals', fn ($q) => $this->scopeActiveApproverQuery($q, $user))
            ->count();
    }

    /**
     * Constrains a stock_export_request_approvals subquery to rows where:
     *  - the approval is PENDING
     *  - it is the currently active step (lowest sort_order among pending steps)
     *  - the given user is the designated approver, a role-holder, or the delegatee
     *
     * @param  Builder<Model>  $q
     */
    private function scopeActiveApproverQuery(Builder $q, User $user): void
    {
        $userRoles = $user->getRoleNames()->all();

        $q->where('stock_export_request_approvals.status', 'PENDING')
            ->join('workflow_steps as ws', 'ws.id', '=', 'stock_export_request_approvals.workflow_step_id')
            ->whereRaw('ws.sort_order = (
                SELECT MIN(ws2.sort_order)
                FROM stock_export_request_approvals sera2
                JOIN workflow_steps ws2 ON ws2.id = sera2.workflow_step_id
                WHERE sera2.stock_export_request_id = stock_export_request_approvals.stock_export_request_id
                AND sera2.status = ?
            )', ['PENDING'])
            ->where(function ($q2) use ($user, $userRoles) {
                $q2->where('ws.approver_user_id', $user->id)
                    ->orWhere('stock_export_request_approvals.delegated_to_user_id', $user->id);
                if (! empty($userRoles)) {
                    $q2->orWhereIn('ws.approver_role', $userRoles);
                }
            });
    }

    /**
     * Export request hydrated for the "repeat from" create flow, or null when
     * the source does not exist.
     */
    public function findForRepeat(int $exportRequestId): ?StockExportRequest
    {
        return StockExportRequest::with(['lines.item.defaultUnit', 'lines.unit'])
            ->find($exportRequestId);
    }

    /**
     * The given export requests with workflow context loaded, keyed by id
     * (used by the bulk approve flow).
     *
     * @param  array<int, int>  $ids
     * @return Collection<int, StockExportRequest>
     */
    public function getByIdsWithWorkflowContext(array $ids): Collection
    {
        return StockExportRequest::whereIn('id', $ids)
            ->with(['workflowTemplate', 'requestedBy'])
            ->get()
            ->keyBy('id');
    }

    public function create(array $fields): StockExportRequest
    {
        return StockExportRequest::create($fields);
    }

    /**
     * Whether the export request has ever been rejected.
     */
    public function hasRejectedHistory(StockExportRequest $request): bool
    {
        return $request->histories()->where('event', 'REJECTED')->exists();
    }

    public function findLineOrFail(int|string $lineId): StockExportRequestLine
    {
        return StockExportRequestLine::findOrFail($lineId);
    }

    public function incrementLineQtyFulfilled(StockExportRequestLine $line, float $qty): void
    {
        $line->increment('qty_fulfilled', $qty);
    }

    public function createFulfillment(array $fields): StockExportRequestFulfillment
    {
        return StockExportRequestFulfillment::create($fields);
    }

    public function createFulfillmentLine(array $fields): StockExportRequestFulfillmentLine
    {
        return StockExportRequestFulfillmentLine::create($fields);
    }

    public function createHistory(array $fields): StockExportRequestHistory
    {
        return StockExportRequestHistory::create($fields);
    }
}
