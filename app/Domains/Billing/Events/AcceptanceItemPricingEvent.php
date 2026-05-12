<?php

namespace App\Domains\Billing\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AcceptanceItemPricingEvent
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public array $invoiceItems)
    {
    }
}
