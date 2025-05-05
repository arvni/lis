<?php

namespace App\Domains\Laboratory\Events;

use App\Domains\Laboratory\Enums\ActionType;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SectionEvent
{
    use Dispatchable, InteractsWithSockets, SerializesModels;



    /**
     * Create a new event instance.
     */
    public function __construct(public ActionType $action,public array $sectionData=[],public array $sectionOldData=[])
    {
    }

}
