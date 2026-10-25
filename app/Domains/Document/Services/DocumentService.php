<?php

declare(strict_types=1);

namespace App\Domains\Document\Services;

use App\Domains\Document\Enums\DocumentTag;
use App\Domains\Document\Models\Document;
use App\Domains\Document\Repositories\DocumentRepository;
use App\Domains\Document\Support\ActiveContent;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\Mime\MimeTypes;

class DocumentService
{
    public function __construct(private readonly DocumentRepository $documentRepository) {}

    public function storeDocument(string $ownerClass, int $id, UploadedFile $file, string $tag, ?string $relatedType = null, int|string|null $relatedId = null, ?string $title = null, ?string $description = null): Document
    {
        $document = new Document([
            'owner_type' => $ownerClass,
            'owner_id' => $id,
            'related_type' => $relatedType,
            'related_id' => $relatedId,
            'hash' => Str::uuid(),
            'ext' => $file->getClientOriginalExtension(),
            'tag' => $tag,
            'originalName' => $file->getClientOriginalName(),
            'title' => $title,
            'description' => $description,
        ]);
        $document->path = $document->address.'/'.$document->file_name;
        $document->save();

        Storage::disk('local')->putFileAs($document->address, $file, $document->file_name);

        return $document->refresh();
    }

    public function showDocument(Document $document): BinaryFileResponse
    {
        $filePath = storage_path("app/private/$document->path");
        if (! file_exists($filePath)) {
            abort(404, 'File not found.');
        }

        // The type comes from the file's own bytes, never from its name. Only PDF and raster
        // images open in the browser; anything else (including SVG/HTML stored before uploads
        // were filtered) is a download, so it can't run script on the LIS origin. The viewers
        // for Office, spreadsheet and text files fetch() the body, which a download doesn't affect.
        $mimeType = MimeTypes::getDefault()->guessMimeType($filePath) ?? 'application/octet-stream';
        $inline = ActiveContent::mayShowInline($mimeType);

        $headers = [
            'Content-Type' => $mimeType,
            'X-Content-Type-Options' => 'nosniff',
            'Cache-Control' => 'no-cache, no-store, must-revalidate',
            'Pragma' => 'no-cache',
            'Expires' => '0',
        ];

        // Chrome's PDF viewer refuses to run inside a sandboxed document, so PDFs keep no CSP sandbox.
        if ($mimeType !== 'application/pdf') {
            $headers['Content-Security-Policy'] = "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox";
        }

        return response()->download(
            $filePath,
            $document->originalName,
            $headers,
            $inline ? 'inline' : 'attachment');
    }

    public function getDocument(int|string $id): ?Document
    {
        return Document::find($id);
    }

    /**
     * Re-home a batch of documents onto one owner/related pair atomically.
     * Each document keeps its own tag unless it is untagged or still TEMP,
     * in which case it takes the batch-level tag.
     *
     * @param  list<array{id: string, tag?: string|null}>  $documents
     */
    public function batchUpdate(
        array $documents,
        int $ownerId,
        string $ownerType,
        ?string $relatedType,
        ?int $relatedId,
        ?string $tag
    ): void {
        DB::transaction(function () use ($documents, $ownerId, $ownerType, $relatedType, $relatedId, $tag): void {
            $found = $this->documentRepository->getByHashes(array_column($documents, 'id'))->keyBy('hash');
            foreach ($documents as $documentData) {
                $document = $found->get($documentData['id']);
                if ($document === null) {
                    continue;
                }
                $this->updateDocument($document, [
                    'owner_id' => $ownerId,
                    'owner_type' => $ownerType,
                    'related_type' => $relatedType,
                    'related_id' => $relatedId,
                    'tag' => $this->resolveBatchTag($documentData['tag'] ?? null, $tag),
                ]);
            }
        });
    }

    private function resolveBatchTag(?string $documentTag, ?string $batchTag): DocumentTag|string|null
    {
        if ($documentTag === null || $documentTag === DocumentTag::TEMP->value) {
            return $batchTag;
        }

        return DocumentTag::find($documentTag);
    }

    public function updateDocument(Document $document, array $newData): Document
    {
        $src = $document->path;
        $document->fill([
            'owner_id' => $newData['owner_id'] ?? $document->owner_id,
            'owner_type' => $newData['owner_type'] ?? $document->owner_type,
            'related_type' => $newData['related_type'] ?? $document->related_type,
            'related_id' => $newData['related_id'] ?? $document->related_id,
            'tag' => $newData['tag'] ?? $document->tag,
        ]);
        $dest = $document->address.'/'.$document->file_name;
        if (Storage::move($src, $dest)) {
            $document->path = $dest;
            $document->save();

            return $document;
        }

        return $document;
    }

    public function deleteDocument(Document $document): void
    {
        Storage::delete("{$document->address}/{$document->file_name}");
        $document->delete();
    }
}
