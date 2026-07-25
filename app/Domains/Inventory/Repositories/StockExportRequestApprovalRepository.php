<?php

declare(strict_types=1);

namespace App\Domains\Inventory\Repositories;

use App\Domains\Inventory\Enums\ApprovalStatus;
use App\Domains\Inventory\Models\StockExportRequest;
use App\Domains\Inventory\Models\StockExportRequestApproval;
use Illuminate\Support\Collection;

class StockExportRequestApprovalRepository
{
    public function create(array $fields): StockExportRequestApproval
    {
        return StockExportRequestApproval::create($fields);
    }

    /**
     * An export request's approvals ordered by workflow step, with step and
     * actor relations loaded.
     *
     * @return Collection<int, StockExportRequestApproval>
     */
    public function getOrderedForRequest(StockExportRequest $request): Collection
    {
        return StockExportRequestApproval::where('stock_export_request_id', $request->id)
            ->join('workflow_steps', 'workflow_steps.id', '=', 'stock_export_request_approvals.workflow_step_id')
            ->orderBy('workflow_steps.sort_order')
            ->select('stock_export_request_approvals.*')
            ->with(['step', 'step.approverUser', 'actedBy'])
            ->get();
    }

    /**
     * The currently active (lowest sort_order, still pending) approval step,
     * optionally locked for update.
     */
    public function findActiveForRequest(StockExportRequest $request, bool $lock = false): ?StockExportRequestApproval
    {
        return StockExportRequestApproval::where('stock_export_request_id', $request->id)
            ->where('status', ApprovalStatus::PENDING)
            ->join('workflow_steps', 'workflow_steps.id', '=', 'stock_export_request_approvals.workflow_step_id')
            ->orderBy('workflow_steps.sort_order')
            ->select('stock_export_request_approvals.*')
            ->with(['step.approverUser'])
            ->when($lock, fn ($q) => $q->lockForUpdate())
            ->first();
    }

    public function hasPendingForRequest(StockExportRequest $request): bool
    {
        return StockExportRequestApproval::where('stock_export_request_id', $request->id)
            ->where('status', ApprovalStatus::PENDING)
            ->exists();
    }

    /**
     * Whether any step has already been acted on (approved or rejected),
     * locking the matched rows to prevent a race with an approver.
     */
    public function hasActedSteps(StockExportRequest $request): bool
    {
        return StockExportRequestApproval::where('stock_export_request_id', $request->id)
            ->whereIn('status', [ApprovalStatus::APPROVED->value, ApprovalStatus::REJECTED->value])
            ->lockForUpdate()
            ->exists();
    }

    /**
     * Mark every still-pending step of the request as rejected.
     */
    public function rejectAllPending(StockExportRequest $request): void
    {
        StockExportRequestApproval::where('stock_export_request_id', $request->id)
            ->where('status', ApprovalStatus::PENDING)
            ->update(['status' => ApprovalStatus::REJECTED->value]);
    }

    public function deleteForRequest(StockExportRequest $request): void
    {
        $request->approvals()->delete();
    }
}
