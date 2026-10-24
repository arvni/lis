<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\Adapters;

use App\Domains\Document\Enums\DocumentTag;
use App\Domains\Document\Models\Document;
use App\Domains\Document\Services\DocumentService;
use App\Domains\PreOrder\Models\PreOrder;
use App\Domains\PreOrder\Models\PreOrderQuotation;
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
        return $this->documents->storeDocument('preorder', $preOrder->id, $this->file($upload, $name), $tag->value);
    }

    /** The quotation's PDF, linked to it so each quotation knows its file. */
    public function storeQuotation(PreOrder $preOrder, PreOrderQuotation $quotation, InspectedUpload $pdf): Document
    {
        return $this->documents->storeDocument('preorder', $preOrder->id, $this->file($pdf, "Quotation {$quotation->number}"), DocumentTag::QUOTATION->value, 'pre_order_quotation', $quotation->id);
    }

    /** The stored extension is the inspected type, whatever the file was called. */
    private function file(InspectedUpload $upload, string $name): UploadedFile
    {
        return new UploadedFile($upload->path, pathinfo($name, PATHINFO_FILENAME).'.'.$upload->extension, $upload->mimeType, null, true);
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
