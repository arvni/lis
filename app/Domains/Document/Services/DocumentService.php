<?php

namespace App\Domains\Document\Services;

use App\Domains\Document\Models\Document;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class DocumentService
{
    public function storeDocument(string $ownerClass, int $id, UploadedFile $file, string $tag, ?string $relatedType = null, int|string $relatedId = null): Document
    {
        $document = new Document([
            "owner_type" => $ownerClass,
            "owner_id" => $id,
            'related_type' => $relatedType,
            'related_id' => $relatedId,
            'hash' => Str::uuid(),
            'ext' => $file->getClientOriginalExtension(),
            'tag' => $tag,
            'originalName' => $file->getClientOriginalName(),
        ]);
        $document->path = $document->address . "/" . $document->file_name;
        $document->save();

        Storage::disk('local')->putFileAs($document->address, $file, $document->file_name);

        return $document->refresh();
    }

    public function showDocument(Document $document): BinaryFileResponse
    {
        $filePath = storage_path("app/private/$document->path");
        if (!file_exists($filePath)) {
            abort(404, 'File not found.');
        }

        return response()->file($filePath);
    }

    public function getDocument($id)
    {
        return Document::find($id);
    }


    public function updateDocument(Document $document, $newData): Document
    {
        $src = $document->path;
        $document->fill([
            'owner_id' => $newData['owner_id'] ?? $document->owner_id,
            "owner_type" => $newData['owner_type'] ?? $document->owner_type,
            'related_type' => $newData['related_type'] ?? $document->related_type,
            'related_id' => $newData['related_id'] ?? $document->related_id,
            'tag' => $newData['tag'] ?? $document->tag
        ]);
        $dest = $document->address . '/' . $document->file_name;
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
