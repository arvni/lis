<?php

namespace App\Http\Controllers\Document;

use App\Domains\Document\Enums\DocumentTag;
use App\Domains\Document\Services\DocumentService;
use App\Domains\Laboratory\Requests\UpdateDocumentBatchUpdateRequest;
use App\Http\Controllers\Controller;

class UpdateBatchDocumentsController extends Controller
{
    public function __construct(private DocumentService $documentService)
    {
    }

    /**
     * Handle the incoming request.
     */
    public function __invoke(UpdateDocumentBatchUpdateRequest $request)
    {
        $validated = $request->validated();
        foreach ($validated['documents'] as $documentData) {
            $document = $this->documentService->getDocument($documentData['id']);
            $this->documentService->updateDocument($document, [
                'owner_id' => $validated['ownerId'],
                'owner_type' => $validated['ownerClass'],
                'related_type' => $validated['relatedClass'] ?? null,
                'related_id' => $validated['relatedId'] ?? null,
                'tag' => ($documentData['tag'] == DocumentTag::TEMP->value || !isset($documentData["tag"])) ? $validated['tag'] : DocumentTag::find($documentData["tag"]),
            ]);
        }
        return back()->with(['success' => true, 'status' => 'Documents updated successfully']);
    }
}
