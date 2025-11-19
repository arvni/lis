<?php

namespace App\Events;

use App\Domains\Reception\Models\Patient;
use App\Domains\Referrer\Models\ReferrerOrder;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ReferrerOrderPatientCreated
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public ReferrerOrder $referrerOrder;
    public Patient $patient;
    public bool $isMainPatient;

    /**
     * Create a new event instance.
     */
    public function __construct(ReferrerOrder $referrerOrder, Patient $patient, bool $isMainPatient = false)
    {
        $this->referrerOrder = $referrerOrder;
        $this->patient = $patient;
        $this->isMainPatient = $isMainPatient;
    }
}
