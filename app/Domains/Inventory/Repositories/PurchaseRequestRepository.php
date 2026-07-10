<?php

declare(strict_types=1);

namespace App\Domains\Inventory\Repositories;

use App\Domains\Inventory\Enums\PurchaseRequestStatus;
use App\Domains\Inventory\Models\PurchaseRequest;
use App\Domains\Inventory\Models\PurchaseRequestHistory;
use App\Domains\Inventory\Models\PurchaseRequestLine;
use App\Domains\Inventory\Models\PurchaseRequestReceipt;
use App\Domains\Inventory\Models\PurchaseRequestReceiptLine;
use App\Domains\User\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

class PurchaseRequestRepository
{
    /**
     * Paginated purchase requests for the index screen, scoped by view:
     * 'mine' (default) — PRs the user created; 'approval' — workflow PRs
     * awaiting the user's action; 'all' — union of both.
     *
     * @return LengthAwarePaginator<int, PurchaseRequest>
     */
    public function listForUser(User $user, array $filters): LengthAwarePaginator
    {
        $view = $filters['filters']['view'] ?? 'mine';
        $status = $filters['filters']['status'] ?? '';
        $urgency = $filters['filters']['urgency'] ?? '';

        $query = PurchaseRequest::with(['requestedBy', 'lines.item', 'lines.unit'])
            ->withCount('lines')
            ->orderBy('created_at', 'desc');

        if ($view === 'approval') {
            // Only workflow-based PRs where this user is explicitly the active step approver or delegatee
            $query->where('status', PurchaseRequestStatus::SUBMITTED)
                ->whereHas('approvals', fn ($sub) => $this->scopeActiveApproverQuery($sub, $user));
        } elseif ($view === 'all') {
            // Union: PRs the user created OR workflow PRs awaiting their action
            $query->where(function ($q) use ($user) {
                $q->where('requested_by_user_id', $user->id)
                    ->orWhere(function ($sub) use ($user) {
                        $sub->where('status', PurchaseRequestStatus::SUBMITTED)
                            ->whereHas('approvals', fn ($s) => $this->scopeActiveApproverQuery($s, $user));
                    });
            });
        } else {
            // 'mine' — PRs the user created (default)
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
     * How many submitted purchase requests are waiting on this user's approval.
     */
    public function countPendingApprovalFor(User $user): int
    {
        return PurchaseRequest::where('status', PurchaseRequestStatus::SUBMITTED)
            ->whereHas('approvals', fn ($q) => $this->scopeActiveApproverQuery($q, $user))
            ->count();
    }

    /**
     * Constrains a purchase_request_approvals subquery to rows where:
     *  - the approval is PENDING
     *  - it is the currently active step (lowest sort_order among pending steps)
     *  - the given user is the designated approver, a role-holder, or the delegatee
     *
     * @param  Builder<Model>  $q
     */
    private function scopeActiveApproverQuery(Builder $q, User $user): void
    {
        $userRoles = $user->getRoleNames()->all();

        $q->where('purchase_request_approvals.status', 'PENDING')
            ->join('workflow_steps as ws', 'ws.id', '=', 'purchase_request_approvals.workflow_step_id')
            ->whereRaw('ws.sort_order = (
                SELECT MIN(ws2.sort_order)
                FROM purchase_request_approvals pra2
                JOIN workflow_steps ws2 ON ws2.id = pra2.workflow_step_id
                WHERE pra2.purchase_request_id = purchase_request_approvals.purchase_request_id
                AND pra2.status = ?
            )', ['PENDING'])
            ->where(function ($q2) use ($user, $userRoles) {
                $q2->where('ws.approver_user_id', $user->id)
                    ->orWhere('purchase_request_approvals.delegated_to_user_id', $user->id);
                if (! empty($userRoles)) {
                    $q2->orWhereIn('ws.approver_role', $userRoles);
                }
            });
    }

    /**
     * Purchase request hydrated for the "repeat from" create flow, or null when
     * the source does not exist.
     */
    public function findForRepeat(int $purchaseRequestId): ?PurchaseRequest
    {
        return PurchaseRequest::with(['lines.item.defaultUnit', 'lines.unit', 'lines.preferredSupplier'])
            ->find($purchaseRequestId);
    }

    /**
     * The given purchase requests with workflow context loaded, keyed by id
     * (used by the bulk approve flow).
     *
     * @param  array<int, int>  $ids
     * @return Collection<int, PurchaseRequest>
     */
    public function getByIdsWithWorkflowContext(array $ids): Collection
    {
        return PurchaseRequest::whereIn('id', $ids)
            ->with(['workflowTemplate', 'requestedBy'])
            ->get()
            ->keyBy('id');
    }

    public function create(array $fields): PurchaseRequest
    {
        return PurchaseRequest::create($fields);
    }

    /**
     * Whether the purchase request has ever been rejected.
     */
    public function hasRejectedHistory(PurchaseRequest $pr): bool
    {
        return $pr->histories()->where('event', 'REJECTED')->exists();
    }

    public function findLineOrFail(int|string $lineId): PurchaseRequestLine
    {
        return PurchaseRequestLine::findOrFail($lineId);
    }

    public function incrementLineQtyReceived(PurchaseRequestLine $line, float $qty): void
    {
        $line->increment('qty_received', $qty);
    }

    public function updateLineBrand(PurchaseRequest $pr, int|string $lineId, ?string $brand): void
    {
        $pr->lines()->where('id', $lineId)->update(['brand' => $brand]);
    }

    public function createReceipt(array $fields): PurchaseRequestReceipt
    {
        return PurchaseRequestReceipt::create($fields);
    }

    public function createReceiptLine(array $fields): PurchaseRequestReceiptLine
    {
        return PurchaseRequestReceiptLine::create($fields);
    }

    public function createHistory(array $fields): PurchaseRequestHistory
    {
        return PurchaseRequestHistory::create($fields);
    }
}
