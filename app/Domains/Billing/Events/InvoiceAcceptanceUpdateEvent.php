<?php


namespace App\Domains\Billing\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class InvoiceAcceptanceUpdateEvent
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int $acceptanceId;
    public int $invoiceId;


    /**
     * Create a new event instance.
     */
    public function __construct($acceptanceId, $invoiceId)
    {
        $this->acceptanceId = $acceptanceId;
        $this->invoiceId = $invoiceId;
    }

}
