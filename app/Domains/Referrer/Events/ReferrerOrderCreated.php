<?php

namespace App\Domains\Referrer\Events;

use App\Domains\Referrer\Models\ReferrerOrder;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ReferrerOrderCreated
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public ReferrerOrder $referrerOrder)
    {
    }
}
