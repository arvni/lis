<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\Adapters;

use App\Domains\Document\Enums\DocumentTag;
use App\Domains\Document\Models\Document;
use App\Domains\Document\Services\DocumentService;
use App\Domains\PreOrder\Models\PreOrder;
use App\Domains\PreOrder\Support\InspectedUpload;
use Illuminate\Http\UploadedFile;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

/** Stores an inspected center file as a document owned by the pre-order. */
class DocumentAdapter
{
    /** Tags a center may give a file. */
    public const CENTER_TAGS = [
        DocumentTag::MEDICAL_HISTORY,
        DocumentTag::ID_CARD,
        DocumentTag::CONSENT_FORM,
        DocumentTag::REQUEST_FORM,
        DocumentTag::PRESCRIPTION,
        DocumentTag::DOCUMENT,
    ];

    public function __construct(private readonly DocumentService $documents) {}

    public function store(PreOrder $preOrder, InspectedUpload $upload, string $name, DocumentTag $tag): Document
    {
        // The stored extension is the inspected type, whatever the center's file was called.
        $file = new UploadedFile($upload->path, pathinfo($name, PATHINFO_FILENAME).'.'.$upload->extension, $upload->mimeType, null, true);

        return $this->documents->storeDocument('preorder', $preOrder->id, $file, $tag->value);
    }

    /** A file of this pre-order, served with the document store's safe headers; 404 for any other. */
    public function download(PreOrder $preOrder, string $hash): BinaryFileResponse
    {
        $document = $this->documents->getDocument($hash);
        abort_unless($document && $document->owner_type === 'preorder' && (int) $document->owner_id === $preOrder->id, 404);

        return $this->documents->showDocument($document);
    }

    /** @return list<string> */
    public static function centerTagValues(): array
    {
        return array_map(fn (DocumentTag $t) => $t->value, self::CENTER_TAGS);
    }
}
