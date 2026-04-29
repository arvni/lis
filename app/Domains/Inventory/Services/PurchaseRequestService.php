<?php

namespace App\Domains\Inventory\Services;

use App\Domains\Document\Enums\DocumentTag;
use App\Domains\Document\Services\DocumentService;
use App\Domains\Inventory\Enums\PurchaseRequestStatus;
use App\Domains\Inventory\Models\PurchaseRequest;
use App\Domains\Inventory\Models\PurchaseRequestHistory;
use App\Domains\Inventory\Models\PurchaseRequestLine;
use App\Domains\Inventory\Models\PurchaseRequestReceipt;
use App\Domains\Inventory\Models\PurchaseRequestReceiptLine;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use RuntimeException;

readonly class PurchaseRequestService
{
    public function __construct(
        private StockTransactionService $transactionService,
        private DocumentService $documentService,
        private PurchaseRequestWorkflowService $workflowService,
        private WorkflowTemplateMatcher $templateMatcher,
    ) {}

    public function listRequests(array $filters): LengthAwarePaginator
    {
        $user = auth()->user();
        $view = $filters['filters']['view'] ?? 'mine';
        $status  = $filters['filters']['status']  ?? '';
        $urgency = $filters['filters']['urgency'] ?? '';

        $query = PurchaseRequest::with(['requestedBy', 'lines.item', 'lines.unit'])
            ->withCount('lines')
            ->orderBy('created_at', 'desc');

        if ($view === 'approval') {
            // Only workflow-based PRs where this user is explicitly the active step approver or delegatee
            $query->where('status', PurchaseRequestStatus::SUBMITTED)
                ->whereHas('approvals', fn($sub) => $this->scopeActiveApproverQuery($sub, $user));
        } elseif ($view === 'all') {
            // Union: PRs the user created OR workflow PRs awaiting their action
            $query->where(function ($q) use ($user) {
                $q->where('requested_by_user_id', $user->id)
                  ->orWhere(function ($sub) use ($user) {
                      $sub->where('status', PurchaseRequestStatus::SUBMITTED)
                          ->whereHas('approvals', fn($s) => $this->scopeActiveApproverQuery($s, $user));
                  });
            });
        } else {
            // 'mine' — PRs the user created (default)
            $query->where('requested_by_user_id', $user->id);
        }

        if ($status  !== '') $query->where('status',  $status);
        if ($urgency !== '') $query->where('urgency', $urgency);

        return $query->paginate($filters['pageSize'] ?? 15);
    }

    public function pendingApprovalCount(): int
    {
        $user = auth()->user();

        return PurchaseRequest::where('status', PurchaseRequestStatus::SUBMITTED)
            ->whereHas('approvals', fn($q) => $this->scopeActiveApproverQuery($q, $user))
            ->count();
    }

    /**
     * Constrains a purchase_request_approvals subquery to rows where:
     *  - the approval is PENDING
     *  - it is the currently active step (lowest sort_order among pending steps)
     *  - the given user is the designated approver, a role-holder, or the delegatee
     */
    private function scopeActiveApproverQuery($q, $user): void
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
                if (!empty($userRoles)) {
                    $q2->orWhereIn('ws.approver_role', $userRoles);
                }
            });
    }

    public function createRequest(array $data): PurchaseRequest
    {
        return DB::transaction(function () use ($data) {
            $lines = $data['lines'] ?? [];
            unset($data['lines']);
            $requester = auth()->user();
            $data['requested_by_user_id'] = $requester->id;
            unset($data['workflow_template_id']); // determined after lines are saved
            $pr = PurchaseRequest::create($data);
            foreach ($lines as $line)
                $pr->lines()->create($line);

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
            foreach ($lines as $line)
                $pr->lines()->create($line);

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
        $isResubmission = $pr->histories()->where('event', 'REJECTED')->exists();

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
            'status'              => PurchaseRequestStatus::APPROVED->value,
            'approved_by_user_id' => auth()->id(),
        ]);
        $this->log($pr, 'APPROVED');
        return $pr;
    }

    public function order(PurchaseRequest $pr, string $poNumber, ?int $supplierId, ?UploadedFile $file): PurchaseRequest
    {
        $updates = [
            'status'      => PurchaseRequestStatus::ORDERED->value,
            'po_number'   => $poNumber,
            'supplier_id' => $supplierId,
        ];
        if ($file) {
            $doc = $this->documentService->storeDocument(
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
            'status'             => PurchaseRequestStatus::PAID->value,
            'payment_date'       => $data['payment_date'],
            'payment_reference'  => $data['payment_reference'] ?? null,
        ];
        if ($file) {
            $doc = $this->documentService->storeDocument(
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
            'status'                => PurchaseRequestStatus::SHIPPED->value,
            'shipment_date'         => $data['shipment_date'] ?? null,
            'tracking_number'       => $data['tracking_number'] ?? null,
            'expected_delivery_date'=> $data['expected_delivery_date'] ?? null,
        ]);
        $this->log($pr, 'SHIPPED', $data['tracking_number'] ?? null);
        return $pr;
    }

    public function receiveItems(PurchaseRequest $pr, array $data): PurchaseRequest
    {
        return DB::transaction(function () use ($pr, $data) {
            $storeId = $data['store_id'];
            $lines   = $data['lines'];

            $txLines = [];
            foreach ($lines as $ld) {
                $prLine = PurchaseRequestLine::findOrFail($ld['pr_line_id']);
                $remaining = (float) $prLine->qty - (float) $prLine->qty_received;
                if ((float) $ld['qty'] > $remaining)
                    throw new RuntimeException("Qty received exceeds remaining for item {$prLine->item->name}.");

                $txLines[] = [
                    'item_id'          => $prLine->item_id,
                    'unit_id'          => $prLine->unit_id,
                    'quantity'         => $ld['qty'],
                    'lot_number'       => $ld['lot_number'] ?? null,
                    'brand'            => $ld['brand'] ?? null,
                    'cat_no'           => $ld['cat_no'] ?? null,
                    'barcode'          => $ld['barcode'] ?? null,
                    'expiry_date'      => $ld['expiry_date'] ?? null,
                    'store_location_id'=> $ld['store_location_id'] ?? null,
                    'unit_price'       => $ld['unit_price'] ?? null,
                    'notes'            => null,
                ];
            }

            // Create, submit, and auto-approve the ENTRY transaction
            $tx = $this->transactionService->createTransaction([
                'transaction_type' => 'ENTRY',
                'transaction_date' => now()->toDateString(),
                'store_id'         => $storeId,
                'supplier_id'      => $pr->supplier_id,
                'notes'            => "Auto-created from PR #{$pr->id} ({$pr->po_number})",
                'lines'            => $txLines,
            ]);
            $this->transactionService->submitForApproval($tx);
            $this->transactionService->approve($tx);

            // Create receipt
            $receipt = PurchaseRequestReceipt::create([
                'purchase_request_id' => $pr->id,
                'transaction_id'      => $tx->id,
                'notes'               => $data['notes'] ?? null,
            ]);

            // Create receipt lines and update qty_received
            foreach ($lines as $ld) {
                $prLine = PurchaseRequestLine::findOrFail($ld['pr_line_id']);
                PurchaseRequestReceiptLine::create([
                    'receipt_id'       => $receipt->id,
                    'pr_line_id'       => $prLine->id,
                    'qty_received'     => $ld['qty'],
                    'unit_price'       => $ld['unit_price'] ?? null,
                    'lot_number'       => $ld['lot_number'] ?? null,
                    'brand'            => $ld['brand'] ?? null,
                    'cat_no'           => $ld['cat_no'] ?? null,
                    'expiry_date'      => $ld['expiry_date'] ?? null,
                    'store_location_id'=> $ld['store_location_id'] ?? null,
                ]);
                $prLine->increment('qty_received', $ld['qty']);
            }

            // Determine new status
            $pr->refresh()->load('lines');
            $allDone = $pr->lines->every(fn($l) => (float) $l->qty_received >= (float) $l->qty);
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
            $pr->lines()->where('id', $lineData['id'])->update(['brand' => $lineData['brand'] ?? null]);
        }
        return $pr;
    }

    public function cancel(PurchaseRequest $pr, ?string $notes = null): PurchaseRequest
    {
        if ($pr->status === PurchaseRequestStatus::RECEIVED)
            throw new RuntimeException('Fully received purchase requests cannot be cancelled.');

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

    private function log(PurchaseRequest $pr, string $event, ?string $notes = null, ?string $changeNotes = null): void
    {
        PurchaseRequestHistory::create([
            'purchase_request_id' => $pr->id,
            'user_id'             => auth()->id(),
            'event'               => $event,
            'notes'               => $notes,
            'change_notes'        => $changeNotes,
        ]);
    }
}
