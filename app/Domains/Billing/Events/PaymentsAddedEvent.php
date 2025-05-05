<?php


namespace App\Domains\Billing\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PaymentsAddedEvent
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int $acceptanceId;


    /**
     * Create a new event instance.
     */
    public function __construct($acceptanceId)
    {
        $this->acceptanceId = $acceptanceId;
    }

}
