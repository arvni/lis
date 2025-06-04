<?php


namespace App\Domains\Reception\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AcceptanceDeletedEvent
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

   public int $invoiceId;



    /**
     * Create a new event instance.
     */
    public function __construct($invoiceId)
    {
        $this->invoiceId = $invoiceId;
    }

}
