<?php

namespace App\Domains\Document\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UploadPublicDocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'mimes:jpg,jpeg,png,svg,webp', 'max:2048'],
        ];
    }
}
