<?php

declare(strict_types=1);

namespace App\Domains\Billing\Resources;

use App\Domains\Billing\Models\DiscountCard;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * The uuid is deliberately absent: it is the card's only credential, and the
 * listing has no use for it. It is emitted solely into the printed QR.
 *
 * @mixin DiscountCard
 */
class DiscountCardResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'number' => $this->number,
            'series' => $this->series,
            'serial' => $this->serial,
            'status' => $this->status,
            'expired' => $this->isExpired(),
            'issued_at' => $this->issued_at?->format('Y-m-d H:i'),
            'activated_at' => $this->activated_at?->format('Y-m-d H:i'),
            'expires_at' => $this->expires_at?->format('Y-m-d'),
            'usage_limit' => $this->usage_limit,
            'used_count' => $this->used_count,
            'partner' => $this->whenLoaded('partner', fn () => [
                'id' => $this->partner->id,
                'name' => $this->partner->name,
            ]),
            'batch' => $this->whenLoaded('batch', fn () => [
                'id' => $this->batch->id,
                'series' => $this->batch->series,
                'printed_at' => $this->batch->printed_at?->format('Y-m-d H:i'),
            ]),
        ];
    }
}
