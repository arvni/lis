<?php


namespace App\Domains\Reception\Events;

use App\Domains\Reception\Models\AcceptanceItem;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AcceptanceItemSampleRejectedEvent
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

   public AcceptanceItem $acceptanceItem;


    /**
     * Create a new event instance.
     */
    public function __construct(AcceptanceItem $acceptanceItem)
    {
        $this->acceptanceItem=$acceptanceItem;
    }

}
