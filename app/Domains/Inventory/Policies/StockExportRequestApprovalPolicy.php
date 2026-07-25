<?php

declare(strict_types=1);

namespace App\Domains\Inventory\Policies;

use App\Domains\Inventory\Enums\StockExportRequestStatus;
use App\Domains\Inventory\Models\StockExportRequest;
use App\Domains\Inventory\Services\StockExportRequestWorkflowService;
use App\Domains\User\Models\User;

/**
 * Encodes the workflow-approver identity rules at the policy layer, so the
 * StockExportRequestController workflow actions gate on the actual approver instead of
 * the coarse `viewAny` ability. The matching service throws in
 * {@see StockExportRequestWorkflowService} are kept as defense-in-depth (and to guard the
 * race inside the DB transaction). Registered as gate abilities in AppServiceProvider (the
 * model already has StockExportRequestPolicy; Laravel allows one Gate::policy per model).
 */
class StockExportRequestApprovalPolicy
{
    public function __construct(private StockExportRequestWorkflowService $workflow) {}

    /** Only the approver of the active step (or its delegate) may approve it. */
    public function approveStep(User $user, StockExportRequest $exportRequest): bool
    {
        return $this->workflow->canAct($exportRequest, $user);
    }

    /** Only the approver of the active step (or its delegate) may reject it. */
    public function rejectStep(User $user, StockExportRequest $exportRequest): bool
    {
        return $this->workflow->canAct($exportRequest, $user);
    }

    /** Only the approver of the active step (or its delegate) may delegate it. */
    public function delegateStep(User $user, StockExportRequest $exportRequest): bool
    {
        return $this->workflow->canAct($exportRequest, $user);
    }

    /** Only the original requester may recall a still-submitted request. */
    public function recall(User $user, StockExportRequest $exportRequest): bool
    {
        return $exportRequest->status === StockExportRequestStatus::SUBMITTED
            && $exportRequest->requested_by_user_id === $user->id;
    }

    /**
     * Bulk approve gates on the coarse "may approve export requests" ability; the
     * per-step approver check is still enforced item-by-item inside the service.
     */
    public function bulkApprove(User $user): bool
    {
        return $user->can('Inventory.ExportRequests.Approve Export Request');
    }
}
