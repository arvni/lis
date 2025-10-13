<?php

namespace App\Domains\Billing\Adapters;

use App\Domains\Reception\Repositories\AcceptanceItemRepository;

class ReceptionAdapter
{
    private AcceptanceItemRepository $acceptanceItemRepository;

    public function __construct(
        AcceptanceItemRepository $acceptanceItemRepository
    )
    {
        $this->acceptanceItemRepository = $acceptanceItemRepository;
    }

    public function updateAcceptanceItem($acceptanceItemData, $type = null): void
    {
        if ($type === 'PANEL') {
            $acceptanceItems = $this->acceptanceItemRepository->getPanelItems($acceptanceItemData["id"], $acceptanceItemData["acceptance_items"][0]["acceptance_id"]);
            foreach ($acceptanceItems as $acceptanceItem) {
                $this->acceptanceItemRepository->updateAcceptanceItem(
                    $acceptanceItem,
                    [
                        "price" => $acceptanceItemData['price'] / count($acceptanceItems),
                        "discount" => $acceptanceItemData['discount'] / count($acceptanceItems),
                        "customParameters" => [
                            ...($acceptanceItem->customParameters ?? []),
                            ...($acceptanceItemData['customParameters'] ?? [])
                        ]
                    ]);
            }
        } else {
            $acceptanceItem = $this->acceptanceItemRepository->findAcceptanceItemById($acceptanceItemData['id']);
            if ($acceptanceItem)
                $this->acceptanceItemRepository->updateAcceptanceItem($acceptanceItem, [
                    "price" => $acceptanceItemData['price'],
                    "discount" => $acceptanceItemData['discount'],
                    "customParameters" => [
                        ...($acceptanceItem->customParameters ?? []),
                        ...($acceptanceItemData['customParameters'] ?? [])
                    ]
                ]);
        }
    }

}
