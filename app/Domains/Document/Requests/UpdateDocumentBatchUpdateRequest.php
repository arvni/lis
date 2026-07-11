<?php

declare(strict_types=1);

namespace App\Domains\Document\Requests;

use App\Domains\Document\Models\Document;
use Illuminate\Foundation\Http\FormRequest;

class UpdateDocumentBatchUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Batch document metadata edit — gate on document editing.
        return $this->user()->can('update', Document::class);
    }

    public function rules(): array
    {
        return [
            'documents' => ['required', 'array'],
            'documents.*.id' => ['required', 'exists:documents,hash'],
            'documents.*.tag' => ['nullable', 'string'],
            'ownerId' => ['required', 'integer'],
            'ownerClass' => ['required', 'string'],
            'relatedId' => ['nullable', 'integer'],
            'relatedClass' => ['nullable', 'string'],
            'tag' => ['nullable', 'string'],
        ];
    }
}
