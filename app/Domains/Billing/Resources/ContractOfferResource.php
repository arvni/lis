<?php

declare(strict_types=1);

namespace App\Domains\Billing\Resources;

use App\Domains\Laboratory\Models\Offer;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Offer as an option in the contract picker. `name` is what SelectSearch labels with.
 *
 * @mixin Offer
 */
class ContractOfferResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->title,
            'type' => $this->type->name,
            'amount' => $this->amount,
            'tests_count' => $this->whenLoaded('tests', fn () => $this->tests->count()),
        ];
    }
}
