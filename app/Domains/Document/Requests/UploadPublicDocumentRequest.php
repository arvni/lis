<?php

declare(strict_types=1);

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
            // No SVG: these land in public/images/icons and are served straight
            // from the LIS origin, where an SVG's script would run when opened.
            'file' => ['required', 'file', 'mimes:jpg,jpeg,png,webp', 'mimetypes:image/jpeg,image/png,image/webp', 'max:2048'],
        ];
    }
}
