<?php

namespace App\Domains\Billing\Adapters;

use App\Domains\Reception\Models\AcceptanceItem;
use App\Domains\Reception\Repositories\AcceptanceItemRepository;
use Illuminate\Database\Eloquent\Collection;

/**
 * Adapter that translates between Billing and Reception domains.
 */
class ReceptionAdapter
{
    public function __construct(private AcceptanceItemRepository $acceptanceItemRepository) {}

    /**
     * Non-service acceptance items in the date range, eager-loaded for the daily cash report.
     *
     * @return Collection<int, AcceptanceItem>
     */
    public function acceptanceItemsForCashReport(array $dateRange): Collection
    {
        return $this->acceptanceItemRepository->getForCashReport($dateRange);
    }

    /**
     * Point the given acceptance items at an invoice item.
     */
    public function linkAcceptanceItemsToInvoiceItem(array $ids, int $invoiceItemId): void
    {
        $this->acceptanceItemRepository->linkToInvoiceItem($ids, $invoiceItemId);
    }
}
