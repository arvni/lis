<?php

declare(strict_types=1);

namespace App\Domains\Inventory\Services;

use App\Domains\Document\Enums\DocumentTag;
use App\Domains\Inventory\Adapters\DocumentAdapter;
use App\Domains\Inventory\Adapters\UserAdapter;
use App\Domains\Inventory\Enums\PurchaseRequestStatus;
use App\Domains\Inventory\Enums\WorkflowRequestType;
use App\Domains\Inventory\Models\PurchaseRequest;
use App\Domains\Inventory\Models\PurchaseRequestLine;
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
        private PurchaseOrderNumberService $poNumbers,
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
     * behalf of $user, skipping any that can't be acted on. Returns the approved
     * count plus a per-id skip reason for every request that wasn't approved.
     *
     * @param  array<int, int>  $ids
     * @return array{approved: int, skipped: array<int, string>}
     */
    public function bulkApproveSteps(array $ids, User $user): array
    {
        $prs = $this->purchaseRequestRepository->getByIdsWithWorkflowContext($ids);

        $approved = 0;
        $skipped = [];
        foreach ($ids as $id) {
            $pr = $prs->get($id);
            if (! $pr) {
                $skipped[$id] = 'Purchase request not found.';

                continue;
            }
            try {
                $this->workflowService->approveStep($pr, $user);
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

        $matched = $this->templateMatcher->find($pr->requestedBy, $urgency, $estimatedTotal, WorkflowRequestType::PURCHASE);

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
            // Set explicitly: the column's DB default isn't read back onto the model,
            // and the lifecycle guards below read $pr->status.
            $data['status'] = PurchaseRequestStatus::DRAFT->value;
            unset($data['workflow_template_id']); // determined after lines are saved
            $pr = $this->purchaseRequestRepository->create($data);
            foreach ($lines as $line) {
                $pr->lines()->create($this->normalizeLine($line));
            }

            // Match template after lines are persisted so estimated total is available
            $pr->load('lines');
            $templateId = $this->templateMatcher
                ->find($requester, $data['urgency'], $pr->estimatedTotal(), WorkflowRequestType::PURCHASE)
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
                $pr->lines()->create($this->normalizeLine($line));
            }

            // Re-match template in case urgency or estimated totals changed
            $pr->load('lines', 'requestedBy');
            $pr->update([
                'workflow_template_id' => $this->templateMatcher
                    ->find($pr->requestedBy, $pr->urgency, $pr->estimatedTotal(), WorkflowRequestType::PURCHASE)
                    ?->id,
            ]);

            return $pr;
        });
    }

    public function submit(PurchaseRequest $pr, ?string $changeNotes = null): PurchaseRequest
    {
        $this->assertStatus($pr, [PurchaseRequestStatus::DRAFT], 'Only draft purchase requests can be submitted.');

        $isResubmission = $this->purchaseRequestRepository->hasRejectedHistory($pr);

        // Re-match template on every submission so late-created templates are picked up
        $pr->load('lines', 'requestedBy');
        $templateId = $this->templateMatcher
            ->find($pr->requestedBy, $pr->urgency, $pr->estimatedTotal(), WorkflowRequestType::PURCHASE)
            ?->id;
        $pr->update(['status' => PurchaseRequestStatus::SUBMITTED->value, 'workflow_template_id' => $templateId]);

        $this->log($pr, $isResubmission ? 'RESUBMITTED' : 'SUBMITTED', null, $changeNotes);
        if ($pr->workflow_template_id) {
            $pr->load('workflowTemplate.steps');
            $this->workflowService->initiate($pr);
        }

        return $pr;
    }

    /**
     * Single-click approval for a request no workflow template matched. Requests
     * with a workflow are approved step by step through the workflow service.
     */
    public function approve(PurchaseRequest $pr): PurchaseRequest
    {
        $this->assertStatus($pr, [PurchaseRequestStatus::SUBMITTED], 'Only submitted purchase requests can be approved.');
        if ($pr->workflow_template_id) {
            throw new RuntimeException('This request has an approval workflow — approve its steps instead.');
        }
        if ($pr->requested_by_user_id === auth()->id()) {
            throw new RuntimeException('You cannot approve your own purchase request.');
        }

        DB::transaction(function () use ($pr) {
            $pr->update([
                'status' => PurchaseRequestStatus::APPROVED->value,
                'approved_by_user_id' => auth()->id(),
                // Numbered only now, so requests that never get approved don't use one up.
                'po_number' => $pr->po_number ?? $this->poNumbers->next(),
            ]);
            $this->log($pr, 'APPROVED');
        });

        return $pr;
    }

    /**
     * Issue the purchase order to the supplier. Its number was assigned on approval.
     * $data names the supplier, the signer whose signature and stamp are printed on the
     * order, and an optional note to the supplier (printed instead of the request's own
     * notes, which are internal).
     *
     * @param  array<string, mixed>  $data
     */
    public function order(PurchaseRequest $pr, array $data, ?UploadedFile $file): PurchaseRequest
    {
        $this->assertStatus($pr, [PurchaseRequestStatus::APPROVED], 'Only approved purchase requests can be ordered.');

        $updates = [
            'status' => PurchaseRequestStatus::ORDERED->value,
            'supplier_id' => isset($data['supplier_id']) ? (int) $data['supplier_id'] : null,
            'signer_user_id' => (int) $data['signer_user_id'],
            'po_notes' => $data['po_notes'] ?? null,
        ];
        if ($file) {
            $doc = $this->documentAdapter->storeDocument(
                PurchaseRequest::class, $pr->id, $file, DocumentTag::PURCHASE_ORDER->value
            );
            $updates['po_file'] = $doc->hash;
        }

        $pr->update($updates);
        $this->log($pr, 'ORDERED', "PO: {$pr->po_number}");

        return $pr;
    }

    public function recordPayment(PurchaseRequest $pr, array $data, ?UploadedFile $file): PurchaseRequest
    {
        $this->assertStatus($pr, [PurchaseRequestStatus::ORDERED], 'Payment can only be recorded for ordered purchase requests.');

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
        $this->assertStatus(
            $pr,
            [PurchaseRequestStatus::ORDERED, PurchaseRequestStatus::PAID],
            'Only ordered or paid purchase requests can be marked as shipped.',
        );

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
        $this->assertStatus(
            $pr,
            [PurchaseRequestStatus::SHIPPED, PurchaseRequestStatus::PARTIALLY_RECEIVED],
            'Items can only be received on shipped purchase requests.',
        );

        return DB::transaction(function () use ($pr, $data) {
            $storeId = $data['store_id'];
            $lines = $data['lines'];

            // Load the request's own lines once and scope everything to them, so a
            // submitted pr_line_id can never reference another request's line (IDOR).
            $pr->load('lines.item');
            $linesById = $pr->lines->keyBy('id');

            // A line may legitimately arrive as several entries (e.g. two lots), so the
            // remaining check runs on each line's total, not on every entry alone.
            $qtyByLine = [];
            foreach ($lines as $ld) {
                $lineId = (int) $ld['pr_line_id'];
                if (! $linesById->has($lineId)) {
                    throw new RuntimeException('A submitted line does not belong to this purchase request.');
                }
                $qtyByLine[$lineId] = ($qtyByLine[$lineId] ?? 0.0) + (float) $ld['qty'];
            }

            foreach ($qtyByLine as $lineId => $qty) {
                $prLine = $linesById->get($lineId);
                $remaining = (float) $prLine->qty - (float) $prLine->qty_received;
                if ($qty > $remaining) {
                    throw new RuntimeException("Qty received exceeds remaining for item {$prLine->displayName()}.");
                }
            }

            $this->linkManualLines($linesById, $lines);

            $txLines = [];
            foreach ($lines as $ld) {
                $prLine = $linesById->get((int) $ld['pr_line_id']);

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
                $prLine = $linesById->get((int) $ld['pr_line_id']);
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

    public function loadForShow(PurchaseRequest $pr, User $user): array
    {
        $pr->load([
            'requestedBy', 'approvedBy', 'supplier', 'signer',
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
            // Who can sign the purchase order, offered when it is issued.
            'signers' => $pr->status === PurchaseRequestStatus::APPROVED && $user->can('order', $pr)
                ? $this->userAdapter->getActiveSignersForSelect()
                : [],
        ];
    }

    /**
     * Everything the printable purchase order shows. Only an approved request carries
     * a PO number, so anything earlier has no purchase order to print.
     *
     * @return array<string, mixed>
     */
    public function loadForPrint(PurchaseRequest $pr): array
    {
        if ($pr->po_number === null) {
            throw new RuntimeException('This request has no purchase order yet — it is numbered once approved.');
        }

        $pr->load([
            'requestedBy', 'supplier.contacts', 'lines.unit',
            // The order carries its signer's signature and stamp.
            'signer:id,name,title,signature,stamp',
            // An item archived after approval still has to be named on the order.
            'lines.item' => fn ($q) => $q->withTrashed(),
        ]);

        return [
            'purchaseRequest' => $pr,
            'approvedAt' => $this->purchaseRequestRepository->approvedAt($pr)?->toIso8601String(),
        ];
    }

    public function getOrderedApprovals(PurchaseRequest $pr): Collection
    {
        return $this->approvalRepository->getOrderedForRequest($pr);
    }

    /**
     * A stock entry needs a real item, so a line that only names an item not in the
     * catalogue is linked on receipt to the item and unit the receiver picked. The
     * typed name stays on the line as a record of what was asked for.
     *
     * @param  Collection<int, PurchaseRequestLine>  $linesById
     * @param  array<int, array<string, mixed>>  $entries
     */
    private function linkManualLines(Collection $linesById, array $entries): void
    {
        /** @var array<int, array{int, int}> $links pr line id => [item id, unit id] */
        $links = [];
        foreach ($entries as $entry) {
            $prLine = $linesById->get((int) $entry['pr_line_id']);
            if (! $prLine->isManual()) {
                continue;
            }

            $link = [(int) ($entry['item_id'] ?? 0), (int) ($entry['unit_id'] ?? 0)];
            if ($link[0] === 0 || $link[1] === 0) {
                throw new RuntimeException("Link \"{$prLine->item_name}\" to a catalogue item and unit before receiving it.");
            }
            if (isset($links[$prLine->id])) {
                if ($links[$prLine->id] !== $link) {
                    throw new RuntimeException("\"{$prLine->item_name}\" is linked to different items in the same receipt.");
                }

                continue;
            }
            if (! $this->purchaseRequestRepository->itemAcceptsUnit($link[0], $link[1])) {
                throw new RuntimeException("The chosen unit isn't used by the item linked to \"{$prLine->item_name}\".");
            }
            $links[$prLine->id] = $link;
        }

        foreach ($links as $lineId => [$itemId, $unitId]) {
            $this->purchaseRequestRepository->linkLineToItem($linesById->get($lineId), $itemId, $unitId);
        }
    }

    /**
     * A line names a catalogue item or a typed item_name, never both: a picked item
     * wins, so a stale typed name can't linger next to it.
     *
     * @param  array<string, mixed>  $line
     * @return array<string, mixed>
     */
    private function normalizeLine(array $line): array
    {
        if (! empty($line['item_id'])) {
            $line['item_name'] = null;
        }

        return $line;
    }

    /**
     * The server-side half of the lifecycle: the Show page only offers an action in
     * the right status, but the endpoint must refuse it otherwise too.
     *
     * @param  list<PurchaseRequestStatus>  $allowed
     */
    private function assertStatus(PurchaseRequest $pr, array $allowed, string $message): void
    {
        if (! in_array($pr->status, $allowed, true)) {
            throw new RuntimeException($message);
        }
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
