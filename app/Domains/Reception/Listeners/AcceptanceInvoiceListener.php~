<?php

namespace App\Domains\Document\Listeners;

use App\Domains\Document\Models\Document;
use App\Domains\Document\Services\DocumentService;

class DocumentUpdateListener
{
    /**
     * Create the event listener.
     */
    public function __construct(protected DocumentService $documentService)
    {
        //
    }

    /**
     * Handle the event.
     */
    public function handle(object $event): void
    {
        $document = $this->documentService->getDocument($event->document);
        if ($document) {
            $this->documentService->updateDocument($document, [
                "owner_type" => $event->ownerClass??$document->owner_type,
                "owner_id" => $event->ownerId??$document->owner_id,
                'tag' => $event->tag??$document->tag,
                "related_type" => $event->relatedType??$document->related_type,
                "related_id" => $event->relatedId??$document->related_id
            ]);
        }
    }
}
