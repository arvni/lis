<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\Requests;

use App\Domains\PreOrder\Adapters\DocumentAdapter;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * A file BION staff attach to a pre-order. Any type the document store accepts (everything but
 * SVG, HTML, scripts and programs), unlike a center's upload, which is PDF, PNG or JPEG only.
 */
class StorePreOrderDocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('review', $this->route('preOrder')) ?? false;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'max:51200', DocumentAdapter::staffFileRule()],
            'title' => ['required', 'string', 'max:150'],
            'description' => ['nullable', 'string', 'max:2000'],
            'tag' => ['required', Rule::in(DocumentAdapter::staffTagValues())],
            'shared' => ['boolean'],
        ];
    }
}
