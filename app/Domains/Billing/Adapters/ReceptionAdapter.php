<?php

namespace App\Domains\Billing\Adapters;

use App\Domains\Reception\Models\Acceptance;
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

    public function findAcceptance(int $id): ?Acceptance
    {
        return Acceptance::query()->withTrashed()->find($id);
    }

    /**
     * An acceptance's items with everything card pricing needs: the test behind
     * each item, so it can be matched against an offer's test list.
     *
     * @return Collection<int, AcceptanceItem>
     */
    public function acceptanceItemsForDiscounting(Acceptance $acceptance): Collection
    {
        return $acceptance->acceptanceItems()
            ->with('methodTest:id,test_id,method_id')
            ->get();
    }

    /**
     * Write back an item's discount total and its discount breakdown.
     *
     * Goes straight to the repository rather than through AcceptanceItemService so
     * it cannot re-trigger the change event that drives the card sync in the first place.
     *
     * @param  array<string, mixed>  $customParameters
     */
    public function writeAcceptanceItemDiscount(AcceptanceItem $item, float $discount, array $customParameters): void
    {
        $this->acceptanceItemRepository->updateAcceptanceItem($item, [
            'discount' => $discount,
            'customParameters' => $customParameters,
        ]);
    }
}
