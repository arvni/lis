<?php

declare(strict_types=1);

namespace App\Domains\Inventory\Services;

use App\Domains\Document\Enums\DocumentTag;
use App\Domains\Inventory\Adapters\DocumentAdapter;
use App\Domains\Inventory\Adapters\UserAdapter;
use App\Domains\Inventory\Enums\PurchaseRequestStatus;
use App\Domains\Inventory\Models\PurchaseRequest;
use App\Domains\Inventory\Models\WorkflowTemplate;
use App\Domains\Inventory\Repositories\PurchaseRequestApprovalRepository;
use App\Domains\Inventory\Repositories\PurchaseRequestRepository;
use App\Domains\Inventory\Repositories\WorkflowTemplateRepository;
use App\Domains\User\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use RuntimeException;

readonly class PurchaseRequestService
{
    public function __construct(
        private StockTransactionService $transactionService,
        private DocumentAdapter $documentAdapter,
        private PurchaseRequestWorkflowService $workflowService,
        private WorkflowTemplateMatcher $templateMatcher,
        private PurchaseRequestRepository $purchaseRequestRepository,
        private PurchaseRequestApprovalRepository $approvalRepository,
        private WorkflowTemplateRepository $templateRepository,
        private UserAdapter $userAdapter,
    ) {}

    public function listRequests(array $filters): LengthAwarePaginator
    {
        return $this->purchaseRequestRepository->listForUser(auth()->user(), $filters);
    }

    public function pendingApprovalCount(): int
    {
        return $this->purchaseRequestRepository->countPendingApprovalFor(auth()->user());
    }

    /**
     * Purchase request hydrated for the "repeat from" create flow, or null when
     * the source does not exist.
     */
    public function findForRepeat(int $purchaseRequestId): ?PurchaseRequest
    {
        return $this->purchaseRequestRepository->findForRepeat($purchaseRequestId);
    }

    /**
     * Approve the active workflow step for each of the given purchase requests on
     * behalf of $user, skipping any that can't be acted on. Returns counts.
     *
     * @param  array<int, int>  $ids
     * @return array{approved: int, skipped: int}
     */
    public function bulkApproveSteps(array $ids, User $user): array
    {
        $prs = $this->purchaseRequestRepository->getByIdsWithWorkflowContext($ids);

        $approved = 0;
        $skipped = 0;
        foreach ($ids as $id) {
            $pr = $prs->get($id);
            if (! $pr) {
                continue;
            }
            try {
                $this->workflowService->approveStep($pr, $user);
                $approved++;
            } catch (\Throwable) {
                $skipped++;
            }
        }

        return ['approved' => $approved, 'skipped' => $skipped];
    }

    /**
     * Add a comment to a purchase request on behalf of the current user.
     */
    public function addComment(PurchaseRequest $pr, string $body): void
    {
        $pr->comments()->create([
            'user_id' => auth()->id(),
            'body' => $body,
        ]);
    }

    /**
     * Evaluate every workflow template against a purchase request, explaining
     * which match and why, and report the template the matcher actually selects.
     * Used by the template-matching debug endpoint.
     *
     * @return array<string, mixed>
     */
    public function evaluateTemplates(PurchaseRequest $pr): array
    {
        $pr->load('lines', 'requestedBy');
        $urgency = $pr->urgency;
        $estimatedTotal = $pr->estimatedTotal();
        $requesterRoles = $pr->requestedBy?->getRoleNames()->all() ?? [];

        $templates = $this->templateRepository->listWithStepsByPriority();

        $evaluated = $templates->map(function (WorkflowTemplate $t) use ($urgency, $requesterRoles, $estimatedTotal) {
            $conditions = $t->conditions ?? [];
            $urgencies = $conditions['urgencies'] ?? [];
            $requiredRoles = $conditions['requester_roles'] ?? [];
            $minTotal = isset($conditions['min_total']) ? (float) $conditions['min_total'] : null;

            $reasons = [];

            if ($t->is_default) {
                $result = 'default_fallback';
            } elseif (empty($urgencies) && empty($requiredRoles) && $minTotal === null) {
                $result = 'skip';
                $reasons[] = 'No conditions defined on a non-default template — never matches';
            } else {
                $result = 'match';
                if (! empty($urgencies) && ! in_array($urgency, $urgencies, true)) {
                    $result = 'no_match';
                    $reasons[] = 'Urgency "'.$urgency.'" not in ['.implode(', ', $urgencies).']';
                }
                if (! empty($requiredRoles) && empty(array_intersect($requiredRoles, $requesterRoles))) {
                    $result = 'no_match';
                    $reasons[] = 'Requester roles ['.implode(', ', $requesterRoles).'] don\'t intersect required ['.implode(', ', $requiredRoles).']';
                }
                if ($minTotal !== null && $estimatedTotal < $minTotal) {
                    $result = 'no_match';
                    $reasons[] = "Estimated total {$estimatedTotal} < min_total {$minTotal}";
                }
            }

            return [
                'id' => $t->id,
                'name' => $t->name,
                'is_active' => $t->is_active,
                'is_default' => $t->is_default,
                'priority' => $t->priority,
                'steps' => $t->steps->count(),
                'conditions' => [
                    'urgencies' => $urgencies,
                    'requester_roles' => $requiredRoles,
                    'min_total' => $minTotal,
                ],
                'result' => $result,   // match | no_match | skip | default_fallback
                'reasons' => $reasons,
            ];
        });

        $matched = $this->templateMatcher->find($pr->requestedBy, $urgency, $estimatedTotal);

        return [
            'pr' => [
                'urgency' => $urgency,
                'estimated_total' => $estimatedTotal,
                'requester_roles' => $requesterRoles,
            ],
            'matched_template' => $matched ? ['id' => $matched->id, 'name' => $matched->name] : null,
            'evaluated' => $evaluated,
        ];
    }

    public function createRequest(array $data): PurchaseRequest
    {
        return DB::transaction(function () use ($data) {
            $lines = $data['lines'] ?? [];
            unset($data['lines']);
            $requester = auth()->user();
            $data['requested_by_user_id'] = $requester->id;
            unset($data['workflow_template_id']); // determined after lines are saved
            $pr = $this->purchaseRequestRepository->create($data);
            foreach ($lines as $line) {
                $pr->lines()->create($line);
            }

            // Match template after lines are persisted so estimated total is available
            $pr->load('lines');
            $templateId = $this->templateMatcher
                ->find($requester, $data['urgency'], $pr->estimatedTotal())
                ?->id;
            $pr->update(['workflow_template_id' => $templateId]);

            $this->log($pr, 'CREATED');

            return $pr->load('lines.item', 'lines.unit');
        });
    }

    public function updateRequest(PurchaseRequest $pr, array $data): PurchaseRequest
    {
        return DB::transaction(function () use ($pr, $data) {
            $lines = $data['lines'] ?? [];
            unset($data['lines']);
            $pr->update($data);
            $pr->lines()->delete();
            foreach ($lines as $line) {
                $pr->lines()->create($line);
            }

            // Re-match template in case urgency or estimated totals changed
            $pr->load('lines', 'requestedBy');
            $pr->update([
                'workflow_template_id' => $this->templateMatcher
                    ->find($pr->requestedBy, $pr->urgency, $pr->estimatedTotal())
                    ?->id,
            ]);

            return $pr;
        });
    }

    public function submit(PurchaseRequest $pr, ?string $changeNotes = null): PurchaseRequest
    {
        $isResubmission = $this->purchaseRequestRepository->hasRejectedHistory($pr);

        // Re-match template on every submission so late-created templates are picked up
        $pr->load('lines', 'requestedBy');
        $templateId = $this->templateMatcher
            ->find($pr->requestedBy, $pr->urgency, $pr->estimatedTotal())
            ?->id;
        $pr->update(['status' => PurchaseRequestStatus::SUBMITTED->value, 'workflow_template_id' => $templateId]);

        $this->log($pr, $isResubmission ? 'RESUBMITTED' : 'SUBMITTED', null, $changeNotes);
        if ($pr->workflow_template_id) {
            $pr->load('workflowTemplate.steps');
            $this->workflowService->initiate($pr);
        }

        return $pr;
    }

    public function approve(PurchaseRequest $pr): PurchaseRequest
    {
        $pr->update([
            'status' => PurchaseRequestStatus::APPROVED->value,
            'approved_by_user_id' => auth()->id(),
        ]);
        $this->log($pr, 'APPROVED');

        return $pr;
    }

    public function order(PurchaseRequest $pr, string $poNumber, ?int $supplierId, ?UploadedFile $file): PurchaseRequest
    {
        $updates = [
            'status' => PurchaseRequestStatus::ORDERED->value,
            'po_number' => $poNumber,
            'supplier_id' => $supplierId,
        ];
        if ($file) {
            $doc = $this->documentAdapter->storeDocument(
                PurchaseRequest::class, $pr->id, $file, DocumentTag::PURCHASE_ORDER->value
            );
            $updates['po_file'] = $doc->hash;
        }

        $pr->update($updates);
        $this->log($pr, 'ORDERED', "PO: {$poNumber}");

        return $pr;
    }

    public function recordPayment(PurchaseRequest $pr, array $data, ?UploadedFile $file): PurchaseRequest
    {
        $updates = [
            'status' => PurchaseRequestStatus::PAID->value,
            'payment_date' => $data['payment_date'],
            'payment_reference' => $data['payment_reference'] ?? null,
        ];
        if ($file) {
            $doc = $this->documentAdapter->storeDocument(
                PurchaseRequest::class, $pr->id, $file, DocumentTag::PAYMENT_RECEIPT->value
            );
            $updates['payment_file'] = $doc->hash;
        }

        $pr->update($updates);
        $this->log($pr, 'PAID', $data['payment_reference'] ?? null);

        return $pr;
    }

    public function markShipped(PurchaseRequest $pr, array $data): PurchaseRequest
    {
        $pr->update([
            'status' => PurchaseRequestStatus::SHIPPED->value,
            'shipment_date' => $data['shipment_date'] ?? null,
            'tracking_number' => $data['tracking_number'] ?? null,
            'expected_delivery_date' => $data['expected_delivery_date'] ?? null,
        ]);
        $this->log($pr, 'SHIPPED', $data['tracking_number'] ?? null);

        return $pr;
    }

    public function receiveItems(PurchaseRequest $pr, array $data): PurchaseRequest
    {
        return DB::transaction(function () use ($pr, $data) {
            $storeId = $data['store_id'];
            $lines = $data['lines'];

            $txLines = [];
            foreach ($lines as $ld) {
                $prLine = $this->purchaseRequestRepository->findLineOrFail($ld['pr_line_id']);
                $remaining = (float) $prLine->qty - (float) $prLine->qty_received;
                if ((float) $ld['qty'] > $remaining) {
                    throw new RuntimeException("Qty received exceeds remaining for item {$prLine->item->name}.");
                }

                $txLines[] = [
                    'item_id' => $prLine->item_id,
                    'unit_id' => $prLine->unit_id,
                    'quantity' => $ld['qty'],
                    'lot_number' => $ld['lot_number'] ?? null,
                    'brand' => $ld['brand'] ?? null,
                    'cat_no' => $ld['cat_no'] ?? null,
                    'barcode' => $ld['barcode'] ?? null,
                    'expiry_date' => $ld['expiry_date'] ?? null,
                    'store_location_id' => $ld['store_location_id'] ?? null,
                    'unit_price' => $ld['unit_price'] ?? null,
                    'notes' => null,
                ];
            }

            // Create, submit, and auto-approve the ENTRY transaction
            $tx = $this->transactionService->createTransaction([
                'transaction_type' => 'ENTRY',
                'transaction_date' => now()->toDateString(),
                'store_id' => $storeId,
                'supplier_id' => $pr->supplier_id,
                'notes' => "Auto-created from PR #{$pr->id} ({$pr->po_number})",
                'lines' => $txLines,
            ]);
            $this->transactionService->submitForApproval($tx);
            $this->transactionService->approve($tx);

            // Create receipt
            $receipt = $this->purchaseRequestRepository->createReceipt([
                'purchase_request_id' => $pr->id,
                'transaction_id' => $tx->id,
                'notes' => $data['notes'] ?? null,
            ]);

            // Create receipt lines and update qty_received
            foreach ($lines as $ld) {
                $prLine = $this->purchaseRequestRepository->findLineOrFail($ld['pr_line_id']);
                $this->purchaseRequestRepository->createReceiptLine([
                    'receipt_id' => $receipt->id,
                    'pr_line_id' => $prLine->id,
                    'qty_received' => $ld['qty'],
                    'unit_price' => $ld['unit_price'] ?? null,
                    'lot_number' => $ld['lot_number'] ?? null,
                    'brand' => $ld['brand'] ?? null,
                    'cat_no' => $ld['cat_no'] ?? null,
                    'expiry_date' => $ld['expiry_date'] ?? null,
                    'store_location_id' => $ld['store_location_id'] ?? null,
                ]);
                $this->purchaseRequestRepository->incrementLineQtyReceived($prLine, (float) $ld['qty']);
            }

            // Determine new status
            $pr->refresh()->load('lines');
            $allDone = $pr->lines->every(fn ($l) => (float) $l->qty_received >= (float) $l->qty);
            $newStatus = $allDone ? PurchaseRequestStatus::RECEIVED : PurchaseRequestStatus::PARTIALLY_RECEIVED;
            $pr->update(['status' => $newStatus->value]);
            $this->log($pr, $allDone ? 'RECEIVED' : 'RECEIVED_PARTIAL',
                "Transaction: {$tx->reference_number}");

            return $pr;
        });
    }

    public function setBrands(PurchaseRequest $pr, array $lines): PurchaseRequest
    {
        foreach ($lines as $lineData) {
            $this->purchaseRequestRepository->updateLineBrand($pr, $lineData['id'], $lineData['brand'] ?? null);
        }

        return $pr;
    }

    public function cancel(PurchaseRequest $pr, ?string $notes = null): PurchaseRequest
    {
        if ($pr->status === PurchaseRequestStatus::RECEIVED) {
            throw new RuntimeException('Fully received purchase requests cannot be cancelled.');
        }

        $pr->update(['status' => PurchaseRequestStatus::CANCELLED->value]);
        $this->log($pr, 'CANCELLED', $notes);

        return $pr;
    }

    public function markOrdered(PurchaseRequest $pr): PurchaseRequest
    {
        $pr->update(['status' => PurchaseRequestStatus::ORDERED->value]);
        $this->log($pr, 'ORDERED');

        return $pr;
    }

    public function loadForShow(PurchaseRequest $pr, User $user): array
    {
        $pr->load([
            'requestedBy', 'approvedBy', 'supplier',
            'workflowTemplate',
            'lines.item.defaultUnit', 'lines.unit', 'lines.preferredSupplier',
            'histories.user',
            'comments.user',
            'receipts.transaction', 'receipts.lines.prLine.item', 'receipts.lines.location',
        ]);

        $approvals = $this->getOrderedApprovals($pr);
        $poDocument = $pr->po_file ? $this->documentAdapter->findDocument($pr->po_file) : null;
        $paymentDocument = $pr->payment_file ? $this->documentAdapter->findDocument($pr->payment_file) : null;

        $isRequester = $pr->requested_by_user_id === $user->id;
        $canActOnWorkflow = $pr->workflow_template_id
            && $pr->status->value === 'SUBMITTED'
            && $this->workflowService->canAct($pr, $user);
        $canDirectApprove = ! $pr->workflow_template_id
            && $user->can('Inventory.PurchaseRequests.Approve Purchase Request')
            && ! $isRequester;
        $wasRejected = $this->purchaseRequestRepository->hasRejectedHistory($pr)
            && $pr->status->value === 'DRAFT';

        return [
            'purchaseRequest' => $pr,
            'approvals' => $approvals,
            'canActOnWorkflow' => $canActOnWorkflow,
            'canDirectApprove' => $canDirectApprove,
            'isRequester' => $isRequester,
            'wasRejected' => $wasRejected,
            'users' => $canActOnWorkflow
                ? $this->userAdapter->getActiveUsersForSelect()
                : [],
            'poDocument' => $poDocument,
            'paymentDocument' => $paymentDocument,
        ];
    }

    public function getOrderedApprovals(PurchaseRequest $pr): Collection
    {
        return $this->approvalRepository->getOrderedForRequest($pr);
    }

    private function log(PurchaseRequest $pr, string $event, ?string $notes = null, ?string $changeNotes = null): void
    {
        $this->purchaseRequestRepository->createHistory([
            'purchase_request_id' => $pr->id,
            'user_id' => auth()->id(),
            'event' => $event,
            'notes' => $notes,
            'change_notes' => $changeNotes,
        ]);
    }
}
