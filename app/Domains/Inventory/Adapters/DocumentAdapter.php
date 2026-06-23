<?php

declare(strict_types=1);

namespace App\Domains\Inventory\Adapters;

use App\Domains\Document\Models\Document;
use App\Domains\Document\Services\DocumentService;
use Illuminate\Http\UploadedFile;

/**
 * Adapter that lets the Inventory domain store and read documents without
 * reaching into the Document domain's services/models directly.
 */
class DocumentAdapter
{
    public function __construct(private readonly DocumentService $documentService) {}

    /**
     * Store an uploaded file as a document and return the created record.
     */
    public function storeDocument(string $ownerClass, int $id, UploadedFile $file, string $tag, ?string $relatedType = null, int|string|null $relatedId = null): Document
    {
        return $this->documentService->storeDocument($ownerClass, $id, $file, $tag, $relatedType, $relatedId);
    }

    /**
     * A single document by id, or null when it does not exist.
     */
    public function findDocument(int|string $id): ?Document
    {
        return $this->documentService->getDocument($id);
    }
}
