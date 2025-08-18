<?php

namespace App\Domains\Document\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreDocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'max:20480'], // 20MB max size
            'tag' => ['nullable', 'string'],
            'ownerClass'=>[ 'nullable', 'string'],
            'ownerId'=>[ 'nullable', 'string'],
        ];
    }
}
