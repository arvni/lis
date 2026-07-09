<?php

declare(strict_types=1);

namespace App\Domains\Reception\Listeners;

use App\Domains\Billing\Events\AcceptanceItemPricingEvent;
use App\Domains\Reception\Adapters\BillingAdapter;
use App\Domains\Reception\Models\AcceptanceItem;
use App\Domains\Reception\Repositories\AcceptanceItemRepository;

class AcceptanceItemPricingListener
{
    public function __construct(
        private AcceptanceItemRepository $acceptanceItemRepository,
        private BillingAdapter $billingAdapter,
    ) {}

    public function handle(AcceptanceItemPricingEvent $event): void
    {
        $touchedAcceptanceItemIds = [];
        foreach ($event->invoiceItems as $type => $items) {
            foreach ($items as $item) {
                $touchedAcceptanceItemIds = array_merge(
                    $touchedAcceptanceItemIds,
                    $this->updateAcceptanceItem($item, $type)
                );
            }
        }
        $this->recomposeInvoicesFor($touchedAcceptanceItemIds);
    }

    private function recomposeInvoicesFor(array $acceptanceItemIds): void
    {
        if (empty($acceptanceItemIds)) {
            return;
        }
        $invoices = AcceptanceItem::query()
            ->whereIn('id', $acceptanceItemIds)
            ->with('invoice')
            ->get()
            ->pluck('invoice')
            ->filter()
            ->unique('id');
        foreach ($invoices as $invoice) {
            $this->billingAdapter->recomposeInvoice($invoice);
        }
    }

    private function updateAcceptanceItem(array $acceptanceItemData, ?string $type): array
    {
        $touched = [];
        if ($type === 'PANEL') {
            $acceptanceItems = $this->acceptanceItemRepository->getPanelItems(
                $acceptanceItemData['id'],
                $acceptanceItemData['acceptance_items'][0]['acceptance_id']
            );
            foreach ($acceptanceItems as $acceptanceItem) {
                $this->acceptanceItemRepository->updateAcceptanceItem($acceptanceItem, [
                    'price' => $acceptanceItemData['price'] / count($acceptanceItems),
                    'discount' => $acceptanceItemData['discount'] / count($acceptanceItems),
                    'customParameters' => [
                        ...($acceptanceItem->customParameters ?? []),
                        ...($acceptanceItemData['customParameters'] ?? []),
                    ],
                ]);
                $touched[] = $acceptanceItem->id;
            }
        } else {
            $acceptanceItem = $this->acceptanceItemRepository->findAcceptanceItemById($acceptanceItemData['id']);
            if ($acceptanceItem) {
                $this->acceptanceItemRepository->updateAcceptanceItem($acceptanceItem, [
                    'price' => $acceptanceItemData['price'],
                    'discount' => $acceptanceItemData['discount'],
                    'customParameters' => [
                        ...($acceptanceItem->customParameters ?? []),
                        ...($acceptanceItemData['customParameters'] ?? []),
                    ],
                ]);
                $touched[] = $acceptanceItem->id;
            }
        }

        return $touched;
    }
}
