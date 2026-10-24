<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SetPreOrderMainTestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('review', $this->route('preOrder')) ?? false;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'test_id' => ['required', 'integer', 'exists:tests,id'],
            'reason' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
