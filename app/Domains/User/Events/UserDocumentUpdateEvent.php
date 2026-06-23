<?php

namespace App\Domains\User\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class UserDocumentUpdateEvent
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public mixed $document;
    public string $ownerClass = "user";
    public int|string|null $ownerId;
    public string $tag;
    public ?string $relatedType=null;
    public int|string|null $relatedId = null;


    /**
     * Create a new event instance.
     */
    public function __construct(mixed $document, int|string|null $ownerId, string $tag, ?string $relatedType = null, int|string|null $relatedId = null)
    {
        $this->document = $document;
        $this->ownerId = $ownerId;
        $this->tag = $tag;
        $this->relatedType = $relatedType;
        $this->relatedId = $relatedId;
    }

}
