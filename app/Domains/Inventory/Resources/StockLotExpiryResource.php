<?php

declare(strict_types=1);

namespace App\Domains\Inventory\Resources;

use App\Domains\Inventory\Models\StockLot;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin StockLot
 */
class StockLotExpiryResource extends JsonResource
{
    /**
     * Shape a stock lot for the expiry dashboard.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'item_id' => $this->item_id,
            'lot_number' => $this->lot_number,
            'brand' => $this->brand,
            'expiry_date' => $this->expiry_date,
            'quantity_base_units' => $this->quantity_base_units,
            'status' => $this->status,
            'item' => $this->whenLoaded('item', fn () => [
                'id' => $this->item->id,
                'name' => $this->item->name,
                'item_code' => $this->item->item_code,
            ]),
            'store' => $this->whenLoaded('store', fn () => [
                'id' => $this->store->id,
                'name' => $this->store->name,
            ]),
            'location' => $this->whenLoaded('location', fn () => [
                'id' => $this->location->id,
                'label' => $this->location->label,
            ]),
        ];
    }
}
