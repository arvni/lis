<?php

namespace App\Domains\Document\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateDocumentBatchUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'documents' => ['required', 'array'],
            'documents.*.id' => ['required', 'exists:documents,hash'],
            'documents.*.tag' => ['nullable'],
            'ownerId' => ['required', 'integer'],
            'ownerClass' => ['required', 'string'],
            'relatedId' => ['nullable', 'integer'],
            'relatedClass' => ['nullable', 'string'],
            'tag' => ['nullable', 'string'],
        ];
    }
}
