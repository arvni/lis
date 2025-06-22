<?php

namespace App\Domains\Laboratory\Events;

use App\Domains\Laboratory\Models\Instruction;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class InstructionUpdated
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */
    public Instruction $instruction;
    public string $action;

    public function __construct(Instruction $instruction, string $action)
    {
        $this->instruction = $instruction;
        $this->action = $action;
    }

}
