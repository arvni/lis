<?php

namespace App\Domains\Reception\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AcceptanceCancelledEvent
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public int $invoiceId)
    {
    }
}
