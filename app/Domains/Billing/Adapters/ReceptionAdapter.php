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

    public function updateAcceptanceItem($acceptanceItemData): void
    {
        $acceptanceItem = $this->acceptanceItemRepository->findAcceptanceItemById($acceptanceItemData['id']);
        if ($acceptanceItem)
            $this->acceptanceItemRepository->updateAcceptanceItem($acceptanceItem, [
                "price" => $acceptanceItemData['price'],
                "discount" => $acceptanceItemData['discount'],
                "customParameters" => [
                    ...[$acceptanceItem->customParameters ?? []],
                    ...[$acceptanceItemData['customParameters'] ?? []]
                ]
            ]);
    }

}
