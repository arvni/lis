<?php

declare(strict_types=1);

namespace App\Http\Controllers\Document;

use App\Domains\Document\Requests\UpdateDocumentBatchUpdateRequest;
use App\Domains\Document\Services\DocumentService;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;

class UpdateBatchDocumentsController extends Controller
{
    public function __construct(private readonly DocumentService $documentService) {}

    /**
     * Handle the incoming request.
     */
    public function __invoke(UpdateDocumentBatchUpdateRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $this->documentService->batchUpdate(
            $validated['documents'],
            (int) $validated['ownerId'],
            $validated['ownerClass'],
            $validated['relatedClass'] ?? null,
            isset($validated['relatedId']) ? (int) $validated['relatedId'] : null,
            $validated['tag'] ?? null,
        );

        return back()->with(['success' => true, 'status' => 'Documents updated successfully']);
    }
}
