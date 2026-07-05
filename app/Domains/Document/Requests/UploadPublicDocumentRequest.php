<?php

namespace App\Domains\Document\Requests;

use App\Domains\Document\Models\Document;
use Illuminate\Foundation\Http\FormRequest;

class UploadPublicDocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Authenticated document upload — gate on document creation.
        return $this->user()->can("create", Document::class);
    }

    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'mimes:jpg,jpeg,png,svg,webp', 'max:2048'],
        ];
    }
}
