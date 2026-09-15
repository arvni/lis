<?php

declare(strict_types=1);

namespace App\Domains\Inventory\Services;

use App\Domains\Inventory\Repositories\PurchaseRequestRepository;

readonly class PurchaseOrderNumberService
{
    public function __construct(private PurchaseRequestRepository $purchaseRequestRepository) {}

    /**
     * The next purchase order number, counted per year.
     * Format: PO-{YYYY}-{XXXX}
     * Example: PO-2026-0001
     *
     * A number is only taken when a request is approved, so drafts, rejected and
     * never-approved requests don't use one up. Call it inside the approving
     * transaction: the year's numbers stay locked until it commits, so two approvals
     * can't be handed the same number.
     */
    public function next(): string
    {
        $prefix = 'PO-'.now()->year.'-';

        // Legacy numbers were typed by hand, so only purely numeric suffixes count.
        $last = $this->purchaseRequestRepository->lockPoNumbersStartingWith($prefix)
            ->map(fn (string $number): string => substr($number, strlen($prefix)))
            ->filter(fn (string $suffix): bool => ctype_digit($suffix))
            ->map(fn (string $suffix): int => (int) $suffix)
            ->max() ?? 0;

        return $prefix.str_pad((string) ($last + 1), 4, '0', STR_PAD_LEFT);
    }
}
