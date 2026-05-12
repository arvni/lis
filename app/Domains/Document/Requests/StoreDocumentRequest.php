<?php

namespace App\Domains\Document\Requests;

use App\Domains\Document\Models\Document;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class StoreDocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('create', Document::class);
    }

    public function rules(): array
    {
        return [
            'file' => ['required', 'file'],
            'tag' => ['nullable', 'string'],
            'ownerClass' => ['nullable', 'string'],
            'ownerId' => ['nullable', 'string'],
        ];
    }
}
