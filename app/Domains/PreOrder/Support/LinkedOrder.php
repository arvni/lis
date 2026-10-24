<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\Support;

use App\Domains\Referrer\Enums\ReferrerOrderStatus;

/** A referrer order released from a pre-order, as the pre-order sees it. */
final readonly class LinkedOrder
{
    public function __construct(
        public int $id,
        public string $orderId,
        public ?string $releaseKey,
        public bool $received,
        public ReferrerOrderStatus $status,
    ) {}

    /** The report is written and only finance or publishing is left. */
    public function isReportReady(): bool
    {
        return $this->isReported() || $this->status === ReferrerOrderStatus::WAITING_FOR_FINANCIAL_APPROVAL;
    }

    public function isReported(): bool
    {
        return in_array($this->status, [ReferrerOrderStatus::REPORTED, ReferrerOrderStatus::DOWNLOADED], true);
    }

    /** @return array<string, mixed> */
    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'order_id' => $this->orderId,
            'release_key' => $this->releaseKey,
            'received' => $this->received,
            'status' => $this->status->value,
        ];
    }
}
