<?php


namespace App\Domains\Reception\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PatientDocumentUpdateEvent
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $document;
    public string $ownerClass = "patient";
    public $ownerId;
    public string $tag;
    public ?string $relatedType = null;
    public $relatedId = null;


    /**
     * Create a new event instance.
     */
    public function __construct($document, $ownerId, $tag, $relatedType = null, $relatedId = null)
    {
        $this->document = $document;
        $this->ownerId = $ownerId;
        $this->tag = $tag;
        $this->relatedType = $relatedType;
        $this->relatedId = $relatedId;
    }

}
