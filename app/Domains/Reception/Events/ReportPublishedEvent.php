<?php


namespace App\Domains\Reception\Events;

use App\Domains\Reception\Models\Acceptance;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ReportPublishedEvent
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

   public Acceptance $acceptance;


    /**
     * Create a new event instance.
     */
    public function __construct(Acceptance $acceptance)
    {
        $this->acceptance=$acceptance;
    }

}
