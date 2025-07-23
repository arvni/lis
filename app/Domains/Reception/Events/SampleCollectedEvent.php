<?php


namespace App\Domains\Reception\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SampleCollectedEvent
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

   public int $acceptanceItemId;
   public string $barcode;
   public int $sampleId;


    /**
     * Create a new event instance.
     */
    public function __construct($acceptanceItemId,$barcode,$sampleId)
    {
        $this->acceptanceItemId=$acceptanceItemId;
        $this->barcode=$barcode;
        $this->sampleId=$sampleId;
    }

}
