<?php

declare(strict_types=1);

namespace App\Domains\Inventory\Repositories;

use App\Domains\Inventory\Enums\ApprovalStatus;
use App\Domains\Inventory\Models\PurchaseRequest;
use App\Domains\Inventory\Models\PurchaseRequestApproval;
use Illuminate\Support\Collection;

class PurchaseRequestApprovalRepository
{
    public function create(array $fields): PurchaseRequestApproval
    {
        return PurchaseRequestApproval::create($fields);
    }

    /**
     * A purchase request's approvals ordered by workflow step, with step and
     * actor relations loaded.
     *
     * @return Collection<int, PurchaseRequestApproval>
     */
    public function getOrderedForRequest(PurchaseRequest $pr): Collection
    {
        return PurchaseRequestApproval::where('purchase_request_id', $pr->id)
            ->join('workflow_steps', 'workflow_steps.id', '=', 'purchase_request_approvals.workflow_step_id')
            ->orderBy('workflow_steps.sort_order')
            ->select('purchase_request_approvals.*')
            ->with(['step', 'step.approverUser', 'actedBy'])
            ->get();
    }

    /**
     * The currently active (lowest sort_order, still pending) approval step,
     * optionally locked for update.
     */
    public function findActiveForRequest(PurchaseRequest $pr, bool $lock = false): ?PurchaseRequestApproval
    {
        return PurchaseRequestApproval::where('purchase_request_id', $pr->id)
            ->where('status', ApprovalStatus::PENDING)
            ->join('workflow_steps', 'workflow_steps.id', '=', 'purchase_request_approvals.workflow_step_id')
            ->orderBy('workflow_steps.sort_order')
            ->select('purchase_request_approvals.*')
            ->with(['step.approverUser'])
            ->when($lock, fn ($q) => $q->lockForUpdate())
            ->first();
    }

    public function hasPendingForRequest(PurchaseRequest $pr): bool
    {
        return PurchaseRequestApproval::where('purchase_request_id', $pr->id)
            ->where('status', ApprovalStatus::PENDING)
            ->exists();
    }

    /**
     * Whether any step has already been acted on (approved or rejected),
     * locking the matched rows to prevent a race with an approver.
     */
    public function hasActedSteps(PurchaseRequest $pr): bool
    {
        return PurchaseRequestApproval::where('purchase_request_id', $pr->id)
            ->whereIn('status', [ApprovalStatus::APPROVED->value, ApprovalStatus::REJECTED->value])
            ->lockForUpdate()
            ->exists();
    }

    /**
     * Mark every still-pending step of the request as rejected.
     */
    public function rejectAllPending(PurchaseRequest $pr): void
    {
        PurchaseRequestApproval::where('purchase_request_id', $pr->id)
            ->where('status', ApprovalStatus::PENDING)
            ->update(['status' => ApprovalStatus::REJECTED->value]);
    }

    public function deleteForRequest(PurchaseRequest $pr): void
    {
        $pr->approvals()->delete();
    }
}
