<?php

declare(strict_types=1);

namespace App\Domains\Inventory\Services;

use App\Domains\Inventory\Adapters\UserAdapter;
use App\Domains\Inventory\Enums\StockExportRequestStatus;
use App\Domains\Inventory\Enums\WorkflowRequestType;
use App\Domains\Inventory\Models\StockExportRequest;
use App\Domains\Inventory\Repositories\StockExportRequestApprovalRepository;
use App\Domains\Inventory\Repositories\StockExportRequestRepository;
use App\Domains\User\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use RuntimeException;

readonly class StockExportRequestService
{
    public function __construct(
        private StockTransactionService $transactionService,
        private StockExportRequestWorkflowService $workflowService,
        private WorkflowTemplateMatcher $templateMatcher,
        private StockExportRequestRepository $exportRequestRepository,
        private StockExportRequestApprovalRepository $approvalRepository,
        private UserAdapter $userAdapter,
    ) {}

    public function listRequests(array $filters): LengthAwarePaginator
    {
        return $this->exportRequestRepository->listForUser(auth()->user(), $filters);
    }

    public function pendingApprovalCount(): int
    {
        return $this->exportRequestRepository->countPendingApprovalFor(auth()->user());
    }

    /**
     * Export request hydrated for the "repeat from" create flow, or null when
     * the source does not exist.
     */
    public function findForRepeat(int $exportRequestId): ?StockExportRequest
    {
        return $this->exportRequestRepository->findForRepeat($exportRequestId);
    }

    /**
     * Approve the active workflow step for each of the given export requests on
     * behalf of $user, skipping any that can't be acted on. Returns the approved
     * count plus a per-id skip reason for every request that wasn't approved.
     *
     * @param  array<int, int>  $ids
     * @return array{approved: int, skipped: array<int, string>}
     */
    public function bulkApproveSteps(array $ids, User $user): array
    {
        $requests = $this->exportRequestRepository->getByIdsWithWorkflowContext($ids);

        $approved = 0;
        $skipped = [];
        foreach ($ids as $id) {
            $request = $requests->get($id);
            if (! $request) {
                $skipped[$id] = 'Export request not found.';

                continue;
            }
            try {
                $this->workflowService->approveStep($request, $user);
                $approved++;
            } catch (RuntimeException $e) {
                // Expected workflow refusals (no pending step, not authorised, …)
                $skipped[$id] = $e->getMessage();
            } catch (\Throwable $e) {
                report($e);
                $skipped[$id] = 'Unexpected error.';
            }
        }

        return ['approved' => $approved, 'skipped' => $skipped];
    }

    /**
     * Add a comment to an export request on behalf of the current user.
     */
    public function addComment(StockExportRequest $request, string $body): void
    {
        $request->comments()->create([
            'user_id' => auth()->id(),
            'body' => $body,
        ]);
    }

    public function createRequest(array $data): StockExportRequest
    {
        return DB::transaction(function () use ($data) {
            $lines = $data['lines'] ?? [];
            unset($data['lines']);
            $requester = auth()->user();
            $data['requested_by_user_id'] = $requester->id;
            unset($data['workflow_template_id']); // determined after creation
            $request = $this->exportRequestRepository->create($data);
            foreach ($lines as $line) {
                $request->lines()->create($line);
            }

            $templateId = $this->templateMatcher
                ->find($requester, $data['urgency'], $request->estimatedValue(), WorkflowRequestType::EXPORT)
                ?->id;
            $request->update(['workflow_template_id' => $templateId]);

            $this->log($request, 'CREATED');

            return $request->load('lines.item', 'lines.unit');
        });
    }

    public function updateRequest(StockExportRequest $request, array $data): StockExportRequest
    {
        return DB::transaction(function () use ($request, $data) {
            $lines = $data['lines'] ?? [];
            unset($data['lines']);
            $request->update($data);
            $request->lines()->delete();
            foreach ($lines as $line) {
                $request->lines()->create($line);
            }

            // Re-match template in case urgency changed
            $request->load('lines', 'requestedBy');
            $request->update([
                'workflow_template_id' => $this->templateMatcher
                    ->find($request->requestedBy, $request->urgency, $request->estimatedValue(), WorkflowRequestType::EXPORT)
                    ?->id,
            ]);

            return $request;
        });
    }

    public function submit(StockExportRequest $request, ?string $changeNotes = null): StockExportRequest
    {
        $isResubmission = $this->exportRequestRepository->hasRejectedHistory($request);

        // Re-match template on every submission so late-created templates are picked up
        $request->load('lines', 'requestedBy');
        $templateId = $this->templateMatcher
            ->find($request->requestedBy, $request->urgency, $request->estimatedValue(), WorkflowRequestType::EXPORT)
            ?->id;
        $request->update(['status' => StockExportRequestStatus::SUBMITTED->value, 'workflow_template_id' => $templateId]);

        $this->log($request, $isResubmission ? 'RESUBMITTED' : 'SUBMITTED', null, $changeNotes);
        if ($request->workflow_template_id) {
            $request->load('workflowTemplate.steps');
            $this->workflowService->initiate($request);
        }

        return $request;
    }

    public function approve(StockExportRequest $request): StockExportRequest
    {
        $request->update([
            'status' => StockExportRequestStatus::APPROVED->value,
            'approved_by_user_id' => auth()->id(),
        ]);
        $this->log($request, 'APPROVED');

        return $request;
    }

    /**
     * Dispatch approved stock: create + auto-approve an EXPORT stock transaction
     * (which FIFO-deducts stock in the source store), record the fulfillment,
     * and advance the request to PARTIALLY_FULFILLED / FULFILLED.
     */
    public function fulfill(StockExportRequest $request, array $data): StockExportRequest
    {
        return DB::transaction(function () use ($request, $data) {
            // Load the request's own lines once and scope everything to them, so a
            // submitted export_line_id can never reference another request's line (IDOR).
            $request->load('lines.item');
            $linesById = $request->lines->keyBy('id');

            // Aggregate the requested quantity per line, so a duplicated export_line_id
            // can't slip past the per-line remaining check by being validated twice.
            $requestedByLine = [];
            foreach ($data['lines'] as $ld) {
                $lineId = (int) $ld['export_line_id'];
                if (! $linesById->has($lineId)) {
                    throw new RuntimeException('A submitted line does not belong to this export request.');
                }
                $requestedByLine[$lineId] = ($requestedByLine[$lineId] ?? 0.0) + (float) $ld['qty'];
            }

            $txLines = [];
            foreach ($requestedByLine as $lineId => $qty) {
                $exportLine = $linesById->get($lineId);
                $remaining = (float) $exportLine->qty - (float) $exportLine->qty_fulfilled;
                if ($qty > $remaining) {
                    throw new RuntimeException("Qty exceeds remaining for item {$exportLine->item->name}.");
                }

                $txLines[] = [
                    'item_id' => $exportLine->item_id,
                    'unit_id' => $exportLine->unit_id,
                    'quantity' => $qty,
                    'notes' => null,
                ];
            }

            // Create, submit, and auto-approve the EXPORT transaction (FIFO deduction happens here)
            $tx = $this->transactionService->createTransaction([
                'transaction_type' => 'EXPORT',
                'transaction_date' => now()->toDateString(),
                'store_id' => $request->store_id,
                'notes' => "Auto-created from export request #{$request->id} → {$request->destination}",
                'lines' => $txLines,
            ]);
            $this->transactionService->submitForApproval($tx);
            $this->transactionService->approve($tx);

            // Record fulfillment
            $fulfillment = $this->exportRequestRepository->createFulfillment([
                'stock_export_request_id' => $request->id,
                'transaction_id' => $tx->id,
                'notes' => $data['notes'] ?? null,
            ]);

            foreach ($requestedByLine as $lineId => $qty) {
                $this->exportRequestRepository->createFulfillmentLine([
                    'fulfillment_id' => $fulfillment->id,
                    'export_line_id' => $lineId,
                    'qty_fulfilled' => $qty,
                ]);
                $this->exportRequestRepository->incrementLineQtyFulfilled($linesById->get($lineId), $qty);
            }

            // Determine new status
            $request->refresh()->load('lines');
            $allDone = $request->lines->every(fn ($l) => (float) $l->qty_fulfilled >= (float) $l->qty);
            $newStatus = $allDone ? StockExportRequestStatus::FULFILLED : StockExportRequestStatus::PARTIALLY_FULFILLED;
            $request->update(['status' => $newStatus->value]);
            $this->log($request, $allDone ? 'FULFILLED' : 'FULFILLED_PARTIAL',
                "Transaction: {$tx->reference_number}");

            return $request;
        });
    }

    public function cancel(StockExportRequest $request, ?string $notes = null): StockExportRequest
    {
        if ($request->status === StockExportRequestStatus::FULFILLED) {
            throw new RuntimeException('Fully fulfilled export requests cannot be cancelled.');
        }

        $request->update(['status' => StockExportRequestStatus::CANCELLED->value]);
        $this->log($request, 'CANCELLED', $notes);

        return $request;
    }

    public function loadForShow(StockExportRequest $request, User $user): array
    {
        $request->load([
            'requestedBy', 'approvedBy', 'store',
            'workflowTemplate',
            'lines.item.defaultUnit', 'lines.unit',
            'histories.user',
            'comments.user',
            'fulfillments.transaction', 'fulfillments.lines.exportLine.item',
        ]);

        $approvals = $this->getOrderedApprovals($request);

        $isRequester = $request->requested_by_user_id === $user->id;
        $canActOnWorkflow = $request->workflow_template_id
            && $request->status->value === 'SUBMITTED'
            && $this->workflowService->canAct($request, $user);
        $canDirectApprove = ! $request->workflow_template_id
            && $user->can('Inventory.ExportRequests.Approve Export Request')
            && ! $isRequester;
        $wasRejected = $this->exportRequestRepository->hasRejectedHistory($request)
            && $request->status->value === 'DRAFT';

        return [
            'exportRequest' => $request,
            'approvals' => $approvals,
            'canActOnWorkflow' => $canActOnWorkflow,
            'canDirectApprove' => $canDirectApprove,
            'isRequester' => $isRequester,
            'wasRejected' => $wasRejected,
            'users' => $canActOnWorkflow
                ? $this->userAdapter->getActiveUsersForSelect()
                : [],
        ];
    }

    public function getOrderedApprovals(StockExportRequest $request): Collection
    {
        return $this->approvalRepository->getOrderedForRequest($request);
    }

    private function log(StockExportRequest $request, string $event, ?string $notes = null, ?string $changeNotes = null): void
    {
        $this->exportRequestRepository->createHistory([
            'stock_export_request_id' => $request->id,
            'user_id' => auth()->id(),
            'event' => $event,
            'notes' => $notes,
            'change_notes' => $changeNotes,
        ]);
    }
}
