<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\Adapters;

use App\Domains\Document\Enums\DocumentTag;
use App\Domains\Document\Models\Document;
use App\Domains\Document\Services\DocumentService;
use App\Domains\Document\Support\ActiveContent;
use App\Domains\PreOrder\Models\PreOrder;
use App\Domains\PreOrder\Models\PreOrderQuotation;
use App\Domains\PreOrder\Support\InspectedUpload;
use Closure;
use Illuminate\Http\UploadedFile;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

/**
 * Files of a pre-order in the document store. A center's file is inspected first and limited to
 * PDF, PNG and JPEG; BION staff may attach any file except active content (SVG, HTML, scripts,
 * programs), and choose whether the center sees it.
 */
class DocumentAdapter
{
    /** related_type of a file BION attached and shared with the center. */
    public const STAFF_SHARED = 'pre_order_staff';

    /** related_type of a file BION attached for its own use only. */
    public const STAFF_INTERNAL = 'pre_order_internal';

    /** Tags BION may give a file it attaches. */
    public const STAFF_TAGS = [
        ...self::CENTER_TAGS,
        DocumentTag::ACCEPTANCE_FORM,
        DocumentTag::PURCHASE_ORDER,
        DocumentTag::PAYMENT_RECEIPT,
    ];

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

    /** A file BION staff attached; it passed staffFileRule() on upload. */
    public function storeStaff(PreOrder $preOrder, UploadedFile $file, DocumentTag $tag, bool $shared): Document
    {
        return $this->documents->storeDocument('preorder', $preOrder->id, $file, $tag->value, $shared ? self::STAFF_SHARED : self::STAFF_INTERNAL);
    }

    public static function isInternal(Document $document): bool
    {
        return $document->related_type === self::STAFF_INTERNAL;
    }

    public static function isFromBion(Document $document): bool
    {
        return in_array($document->related_type, [self::STAFF_SHARED, self::STAFF_INTERNAL, 'pre_order_quotation'], true);
    }

    /** The document store's own upload check: anything but files that would run (SVG, HTML, scripts, programs). */
    public static function staffFileRule(): Closure
    {
        return function (string $attribute, mixed $value, Closure $fail): void {
            if ($value instanceof UploadedFile && ActiveContent::isActive($value)) {
                $fail('This file type is not allowed (SVG, HTML, scripts and programs are blocked).');
            }
        };
    }

    /** @return list<string> */
    public static function staffTagValues(): array
    {
        return array_map(fn (DocumentTag $t) => $t->value, self::STAFF_TAGS);
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
