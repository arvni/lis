<?php

namespace App\Domains\Reception\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SyncTagsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $tags = collect($this->input('tags', []))
            ->map(fn($tag) => is_array($tag) ? ($tag['name'] ?? '') : $tag)
            ->values()
            ->all();

        $this->merge(['tags' => $tags]);
    }

    public function rules(): array
    {
        return [
            'tags' => ['present', 'array', 'max:50'],
            'tags.*' => ['required', 'string', 'max:50', 'regex:/^[A-Za-z0-9 ]+$/'],
        ];
    }

    public function messages(): array
    {
        return [
            'tags.*.regex' => 'Tags may only contain letters, numbers, and spaces.',
        ];
    }
}
