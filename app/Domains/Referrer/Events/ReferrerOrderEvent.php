<?php

namespace App\Domains\Referrer\Events;

use App\Domains\Referrer\Models\ReferrerOrder;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ReferrerOrderEvent
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public string $action = "update";

    /**
     * Create a new event instance.
     * @param ReferrerOrder $referrerOrder
     */
    public function __construct(public ReferrerOrder $referrerOrder)
    {
    }

}
