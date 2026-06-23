<?php

declare(strict_types=1);

namespace App\Domains\Reception\Adapters;

use App\Domains\Document\Models\Document;
use App\Domains\Document\Services\DocumentService;
use Illuminate\Http\UploadedFile;

/**
 * Adapter that lets the Reception domain store, delete and resolve documents
 * without reaching into the Document domain's services/models directly.
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
     * Delete a document and its underlying file.
     */
    public function deleteDocument(Document $document): void
    {
        $this->documentService->deleteDocument($document);
    }

    /**
     * Stored relative path of a document by id, or null when it does not exist.
     */
    public function pathById(int|string $id): ?string
    {
        return $this->documentService->getDocument($id)?->path;
    }
}
