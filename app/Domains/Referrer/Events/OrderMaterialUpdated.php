<?php

namespace App\Domains\Referrer\Events;

use App\Domains\Referrer\Models\OrderMaterial;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OrderMaterialUpdated
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */
    public OrderMaterial $orderMaterial;

    public function __construct(OrderMaterial $orderMaterial)
    {
        $this->orderMaterial = $orderMaterial;
    }

}
