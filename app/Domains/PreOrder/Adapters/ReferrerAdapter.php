<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\Adapters;

use App\Domains\PreOrder\Support\LinkedOrder;
use App\Domains\Referrer\Enums\ReferrerOrderStatus;
use App\Domains\Referrer\Models\ReferrerOrder;
use App\Domains\Referrer\Repositories\ReferrerOrderRepository;

/**
 * Lab progress for a pre-order, read from the referrer orders it released. The orders keep
 * their own statuses; the pre-order only ever reads them.
 */
class ReferrerAdapter
{
    public function __construct(private readonly ReferrerOrderRepository $referrerOrderRepository) {}

    /** @return list<LinkedOrder> */
    public function linkedOrders(int $preOrderId): array
    {
        return $this->referrerOrderRepository->forPreOrder($preOrderId)
            ->map(fn (ReferrerOrder $order) => new LinkedOrder(
                id: $order->id,
                orderId: $order->order_id,
                releaseKey: data_get($order->orderInformation, 'pre_order_release_key'),
                received: $order->acceptance_id !== null,
                status: ReferrerOrderStatus::tryFrom((string) $order->status) ?? ReferrerOrderStatus::WAITING,
            ))
            ->values()
            ->all();
    }
}
