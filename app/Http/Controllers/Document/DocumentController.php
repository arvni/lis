<?php

namespace App\Http\Controllers\Document;

use App\Domains\Document\Enums\DocumentTag;
use App\Domains\Document\Models\Document;
use App\Domains\Document\Requests\StoreDocumentRequest;
use App\Domains\Document\Resources\DocumentResource;
use App\Domains\Document\Services\DocumentService;
use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateDocumentRequest;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class DocumentController extends Controller
{
    public function __construct(protected DocumentService $documentService)
    {
    }

    public function store(StoreDocumentRequest $request): DocumentResource
    {

        $document = $this->documentService->storeDocument(
            $request->input('ownerClass', "user"),
            $request->input('ownerId', auth()->id()),
            $request->file('file'),
            $request->input('tag', DocumentTag::TEMP->value)
        );
        return new DocumentResource($document);
    }

    public function show(Document $document): Response
    {
        return Inertia::render("Document", ["document" => $document]);
    }

    public function update(UpdateDocumentRequest $request, Document $document): DocumentResource
    {
        $this->documentService->updateDocument($document, $request->validated());
        return new DocumentResource($document);
    }

    public function download(Document $document): BinaryFileResponse
    {
        return $this->documentService->showDocument($document);
    }

    public function destroy(Document $document): JsonResponse
    {
        $this->documentService->deleteDocument($document);
        return response()->json(['message' => 'Document successfully deleted.'], 204);
    }
}
