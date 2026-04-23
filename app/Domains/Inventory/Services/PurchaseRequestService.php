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
    ) {}

    public function listRequests(array $filters): LengthAwarePaginator
    {
        $query = PurchaseRequest::with(['requestedBy', 'lines.item', 'lines.unit'])
            ->orderBy('created_at', 'desc');
        if (isset($filters['filters']['status']) && $filters['filters']['status'] !== '')
            $query->where('status', $filters['filters']['status']);
        if (isset($filters['filters']['urgency']) && $filters['filters']['urgency'] !== '')
            $query->where('urgency', $filters['filters']['urgency']);
        return $query->paginate($filters['pageSize'] ?? 15);
    }

    public function createRequest(array $data): PurchaseRequest
    {
        return DB::transaction(function () use ($data) {
            $lines = $data['lines'] ?? [];
            unset($data['lines']);
            $data['requested_by_user_id'] = auth()->id();
            $pr = PurchaseRequest::create($data);
            foreach ($lines as $line)
                $pr->lines()->create($line);
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
            return $pr;
        });
    }

    public function submit(PurchaseRequest $pr): PurchaseRequest
    {
        $pr->update(['status' => PurchaseRequestStatus::SUBMITTED->value]);
        $this->log($pr, 'SUBMITTED');
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

    private function log(PurchaseRequest $pr, string $event, ?string $notes = null): void
    {
        PurchaseRequestHistory::create([
            'purchase_request_id' => $pr->id,
            'user_id'             => auth()->id(),
            'event'               => $event,
            'notes'               => $notes,
        ]);
    }
}
