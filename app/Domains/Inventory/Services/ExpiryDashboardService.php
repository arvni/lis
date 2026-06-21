<?php

declare(strict_types=1);

namespace App\Domains\Inventory\Services;

use App\Domains\Inventory\Repositories\StockLotRepository;
use App\Domains\Inventory\Repositories\StoreRepository;
use App\Domains\Inventory\Resources\StockLotExpiryResource;

class ExpiryDashboardService
{
    public function __construct(
        private readonly StockLotRepository $stockLots,
        private readonly StoreRepository $stores,
    ) {}

    /**
     * Build the expiry dashboard payload: already-expired lots, lots expiring
     * within the window, and the store filter options.
     *
     * @return array<string, mixed>
     */
    public function build(?int $storeId, int $window): array
    {
        return [
            'expired' => StockLotExpiryResource::collection($this->stockLots->expired($storeId))->resolve(),
            'expiringSoon' => StockLotExpiryResource::collection($this->stockLots->expiringWithin($window, $storeId))->resolve(),
            'stores' => $this->stores->activeForSelect(),
            'storeId' => $storeId,
            'window' => $window,
        ];
    }
}
