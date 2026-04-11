<?php

namespace App\Domains\Referrer\Events;

use App\Domains\Referrer\Models\OrderMaterial;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OrderMaterialCreated
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public OrderMaterial $orderMaterial)
    {
    }
}
