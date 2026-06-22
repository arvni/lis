<?php

namespace App\Domains\Inventory\Services;

use App\Domains\Inventory\Enums\TransactionStatus;
use App\Domains\Inventory\Enums\TransactionType;
use App\Domains\Inventory\Models\StockTransaction;
use App\Domains\Inventory\Models\TransactionHistory;
use App\Domains\Inventory\Repositories\StockLotRepository;
use App\Domains\Inventory\Repositories\StockTransactionRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class StockTransactionService
{
    public function __construct(
        private readonly StockTransactionRepository $transactionRepository,
        private readonly ReferenceNumberService     $referenceNumberService,
        private readonly UnitConversionService      $unitConversionService,
        private readonly StockMutationService       $stockMutationService,
        private readonly StockLotRepository         $stockLotRepository,
    ) {}

    /**
     * Transaction hydrated for the "repeat from" create flow, or null when the
     * source does not exist.
     */
    public function findForRepeat(int $transactionId): ?StockTransaction
    {
        return $this->transactionRepository->findForRepeat($transactionId);
    }

    /**
     * Confirm receipt of an APPROVED TRANSFER: activate the quarantined lots in
     * the destination store and stamp the receipt. Returns false when receipt
     * was already confirmed (idempotent no-op); throws on invalid state.
     */
    public function confirmTransferReceipt(StockTransaction $tx, int $userId): bool
    {
        if ($tx->transaction_type !== TransactionType::TRANSFER) {
            throw new RuntimeException('Only TRANSFER transactions can be confirmed.');
        }
        if ($tx->status !== TransactionStatus::APPROVED) {
            throw new RuntimeException('Transaction must be APPROVED before confirming receipt.');
        }
        if ($tx->transfer_received_at) {
            return false;
        }

        DB::transaction(function () use ($tx, $userId) {
            $lotNumbers = $tx->lines->pluck('lot_number')->filter()->unique();

            $this->stockLotRepository->activateQuarantinedLots($tx->destination_store_id, $lotNumbers);

            $tx->update([
                'transfer_received_at'         => now(),
                'transfer_received_by_user_id' => $userId,
            ]);
        });

        return true;
    }

    public function listTransactions(array $filters): LengthAwarePaginator
    {
        return $this->transactionRepository->listTransactions($filters);
    }

    public function createTransaction(array $data): StockTransaction
    {
        return DB::transaction(function () use ($data) {
            $type = TransactionType::from($data['transaction_type']);
            $data['reference_number'] = $this->referenceNumberService->generate($type);
            $data['requested_by_user_id'] = auth()->id();
            $data['status'] = TransactionStatus::DRAFT->value;

            foreach ($data['lines'] as &$line) {
                $line['quantity_base_units'] = $this->unitConversionService->toBaseUnits(
                    $line['item_id'], $line['unit_id'], (float) $line['quantity']
                );
                if (isset($line['unit_price']))
                    $line['total_price'] = (float) $line['unit_price'] * (float) $line['quantity'];
            }
            unset($line);

            $tx = $this->transactionRepository->createTransaction($data);
            $this->log($tx, 'CREATED');
            return $tx;
        });
    }

    public function approve(StockTransaction $tx): StockTransaction
    {
        if (!$tx->isPendingApproval())
            throw new RuntimeException("Transaction must be in PENDING_APPROVAL status to approve.");

        $tx->load('lines.item');
        $shortages = $this->stockMutationService->validateStock($tx);

        if (!empty($shortages)) {
            throw new RuntimeException(
                "Cannot approve — insufficient stock for the following items:\n" . implode("\n", $shortages)
            );
        }

        return DB::transaction(function () use ($tx) {
            $tx = $this->transactionRepository->approve($tx, auth()->id());
            $tx->load('lines.item');
            $this->stockMutationService->apply($tx);
            $this->log($tx, 'APPROVED');
            return $tx;
        });
    }

    public function submitForApproval(StockTransaction $tx): StockTransaction
    {
        if (!$tx->isDraft())
            throw new RuntimeException("Only DRAFT transactions can be submitted for approval.");
        $tx->update(['status' => TransactionStatus::PENDING_APPROVAL->value]);
        $this->log($tx, 'SUBMITTED');
        return $tx;
    }

    public function returnToRequester(StockTransaction $tx, ?string $notes = null): StockTransaction
    {
        if (!$tx->isPendingApproval())
            throw new RuntimeException("Only PENDING_APPROVAL transactions can be returned.");
        $tx->update(['status' => TransactionStatus::DRAFT->value]);
        $this->log($tx, 'RETURNED', $notes);
        return $tx;
    }

    public function updateTransaction(StockTransaction $tx, array $data): StockTransaction
    {
        return DB::transaction(function () use ($tx, $data) {
            $lines = $data['lines'] ?? [];
            unset($data['lines']);

            foreach ($lines as &$line) {
                $line['quantity_base_units'] = $this->unitConversionService->toBaseUnits(
                    $line['item_id'], $line['unit_id'], (float) $line['quantity']
                );
                if (isset($line['unit_price']))
                    $line['total_price'] = (float) $line['unit_price'] * (float) $line['quantity'];
            }
            unset($line);

            $tx->update($data);
            $tx->lines()->delete();
            foreach ($lines as $line)
                $tx->lines()->create($line);

            $this->log($tx, 'REVISED');
            return $tx;
        });
    }

    public function cancel(StockTransaction $tx): StockTransaction
    {
        if ($tx->isApproved())
            throw new RuntimeException("Approved transactions cannot be cancelled.");
        $result = $this->transactionRepository->cancel($tx);
        $this->log($tx, 'CANCELLED');
        return $result;
    }

    public function getTransactionById(int $id): StockTransaction
    {
        return StockTransaction::with([
            'store', 'destinationStore', 'supplier',
            'requestedBy', 'approvedBy',
            'lines.item.defaultUnit', 'lines.unit', 'lines.location',
            'histories.user',
        ])->findOrFail($id);
    }

    private function log(StockTransaction $tx, string $event, ?string $notes = null): void
    {
        TransactionHistory::create([
            'transaction_id' => $tx->id,
            'user_id'        => auth()->id(),
            'event'          => $event,
            'notes'          => $notes,
        ]);
    }
}
