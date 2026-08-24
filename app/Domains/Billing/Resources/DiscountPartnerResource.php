<?php

declare(strict_types=1);

namespace App\Domains\Billing\Resources;

use App\Domains\Billing\Models\DiscountPartner;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin DiscountPartner
 */
class DiscountPartnerResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'contract_no' => $this->contract_no,
            'contact' => $this->contact,
            'starts_at' => $this->starts_at?->format('Y-m-d'),
            'ends_at' => $this->ends_at?->format('Y-m-d'),
            'active' => $this->active,
            'in_force' => $this->isInForce(),
            'notes' => $this->notes,
            'cards_count' => $this->whenCounted('cards'),
            'offers' => $this->whenLoaded('offers', fn () => $this->offers->map(fn ($offer) => [
                'id' => $offer->id,
                'name' => $offer->title,
                'type' => $offer->type->name,
                'amount' => $offer->amount,
            ])),
        ];
    }
}
