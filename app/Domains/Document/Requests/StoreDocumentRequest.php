<?php

declare(strict_types=1);

namespace App\Domains\Document\Requests;

use App\Domains\Document\Models\Document;
use App\Domains\Document\Support\ActiveContent;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\UploadedFile;
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
            'file' => [
                'required',
                'file',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if ($value instanceof UploadedFile && ActiveContent::isActive($value)) {
                        $fail('This file type is not allowed (SVG, HTML, scripts and programs are blocked).');
                    }
                },
            ],
            'tag' => ['nullable', 'string'],
            'ownerClass' => ['nullable', 'string'],
            'ownerId' => ['nullable', 'string'],
        ];
    }
}
