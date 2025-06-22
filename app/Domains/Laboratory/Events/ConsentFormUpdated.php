<?php

namespace App\Domains\Laboratory\Events;

use App\Domains\Laboratory\Models\ConsentForm;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ConsentFormUpdated
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */
    public ConsentForm $consentForm;
    public string $action;

    public function __construct(ConsentForm $consentForm, string $action)
    {
        $this->consentForm = $consentForm;
        $this->action = $action;
    }

}
