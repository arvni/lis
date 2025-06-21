<?php

namespace App\Domains\Laboratory\Events;

use App\Domains\Laboratory\Models\RequestForm;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class RequestFormUpdated
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */
    public RequestForm $requestForm;
    public string $action;

    public function __construct(RequestForm $requestForm, string $action)
    {
        $this->requestForm = $requestForm;
        $this->action = $action;
    }

}
