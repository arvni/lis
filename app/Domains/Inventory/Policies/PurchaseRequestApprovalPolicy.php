<?php

declare(strict_types=1);

namespace App\Domains\Inventory\Policies;

use App\Domains\Inventory\Enums\PurchaseRequestStatus;
use App\Domains\Inventory\Models\PurchaseRequest;
use App\Domains\Inventory\Services\PurchaseRequestWorkflowService;
use App\Domains\User\Models\User;

/**
 * Encodes the workflow-approver identity rules at the policy layer, so the
 * `PurchaseRequestController` workflow actions gate on the actual approver instead of the
 * misleading `viewAny` ability. The matching service throws in
 * {@see PurchaseRequestWorkflowService} are kept as defense-in-depth (and to guard the race
 * inside the DB transaction); this policy makes a non-approver 403 up front rather than 500
 * out of the service. Registered as gate abilities in AppServiceProvider (a model already
 * has PurchaseRequestPolicy; Laravel allows only one Gate::policy per model).
 */
class PurchaseRequestApprovalPolicy
{
    public function __construct(private PurchaseRequestWorkflowService $workflow)
    {
    }

    /** Only the approver of the active step (or its delegate) may approve it. */
    public function approveStep(User $user, PurchaseRequest $purchaseRequest): bool
    {
        return $this->workflow->canAct($purchaseRequest, $user);
    }

    /** Only the approver of the active step (or its delegate) may reject it. */
    public function rejectStep(User $user, PurchaseRequest $purchaseRequest): bool
    {
        return $this->workflow->canAct($purchaseRequest, $user);
    }

    /** Only the approver of the active step (or its delegate) may delegate it. */
    public function delegateStep(User $user, PurchaseRequest $purchaseRequest): bool
    {
        return $this->workflow->canAct($purchaseRequest, $user);
    }

    /** Only the original requester may recall a still-submitted request. */
    public function recall(User $user, PurchaseRequest $purchaseRequest): bool
    {
        return $purchaseRequest->status === PurchaseRequestStatus::SUBMITTED
            && $purchaseRequest->requested_by_user_id === $user->id;
    }

    /**
     * Bulk approve gates on the coarse "may approve purchase requests" ability; the
     * per-step approver check is still enforced item-by-item inside the service (it skips
     * steps the user cannot act on rather than throwing for the whole batch).
     */
    public function bulkApprove(User $user): bool
    {
        return $user->can('Inventory.PurchaseRequests.Approve Purchase Request');
    }
}
