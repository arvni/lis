<?php

namespace App\Domains\Referrer\Events;

use App\Domains\Referrer\Models\CollectRequest;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CollectRequestEvent
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public string $action;
    public $id;

    /**
     * Create a new event instance.
     * @param $id
     * @param string $action (create, update, delete)
     */
    public function __construct(
        $id,
        string $action = "update"
    )
    {
        $this->action = $action;
        $this->id = $id;
    }
}
