<?php

namespace App\Domains\Reception\Listeners;

use App\Domains\Billing\Events\AcceptanceItemPricingEvent;
use App\Domains\Reception\Repositories\AcceptanceItemRepository;

class AcceptanceItemPricingListener
{
    public function __construct(private AcceptanceItemRepository $acceptanceItemRepository)
    {
    }

    public function handle(AcceptanceItemPricingEvent $event): void
    {
        foreach ($event->invoiceItems as $type => $items) {
            foreach ($items as $item) {
                $this->updateAcceptanceItem($item, $type);
            }
        }
    }

    private function updateAcceptanceItem(array $acceptanceItemData, ?string $type): void
    {
        if ($type === 'PANEL') {
            $acceptanceItems = $this->acceptanceItemRepository->getPanelItems(
                $acceptanceItemData['id'],
                $acceptanceItemData['acceptance_items'][0]['acceptance_id']
            );
            foreach ($acceptanceItems as $acceptanceItem) {
                $this->acceptanceItemRepository->updateAcceptanceItem($acceptanceItem, [
                    'price'            => $acceptanceItemData['price'] / count($acceptanceItems),
                    'discount'         => $acceptanceItemData['discount'] / count($acceptanceItems),
                    'customParameters' => [
                        ...($acceptanceItem->customParameters ?? []),
                        ...($acceptanceItemData['customParameters'] ?? []),
                    ],
                ]);
            }
        } else {
            $acceptanceItem = $this->acceptanceItemRepository->findAcceptanceItemById($acceptanceItemData['id']);
            if ($acceptanceItem) {
                $this->acceptanceItemRepository->updateAcceptanceItem($acceptanceItem, [
                    'price'            => $acceptanceItemData['price'],
                    'discount'         => $acceptanceItemData['discount'],
                    'customParameters' => [
                        ...($acceptanceItem->customParameters ?? []),
                        ...($acceptanceItemData['customParameters'] ?? []),
                    ],
                ]);
            }
        }
    }
}
