<?php

namespace App\Domains\Laboratory\Events;

use App\Domains\Laboratory\Models\Instruction;
use App\Domains\Laboratory\Models\SampleType;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SampleTypeUpdated
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */
    public SampleType $sampleType;
    public string $action;

    public function __construct(SampleType $sampleType, string $action)
    {
        $this->sampleType = $sampleType;
        $this->action = $action;
    }

}
