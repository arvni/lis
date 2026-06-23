<?php

namespace App\Domains\Laboratory\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ReportTemplateDocumentUpdateEvent
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public mixed $document;
    public string $ownerClass = "reporttemplate";
    public string|int $ownerId;
    public string $tag;
    public ?string $relatedType = null;
    public int|string|null $relatedId = null;


    /**
     * Create a new event instance.
     */
    public function __construct(mixed $document, int|string $ownerId, string $tag, ?string $relatedType = null, int|string|null $relatedId = null)
    {
        $this->document = $document;
        $this->ownerId = $ownerId;
        $this->tag = $tag;
        $this->relatedType = $relatedType;
        $this->relatedId = $relatedId;
    }

}
