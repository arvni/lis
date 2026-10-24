<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AddPreOrderTestRequest extends FormRequest
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
            'patient_ref' => ['nullable', 'string', 'max:64'],
            'qty' => ['nullable', 'integer', 'min:1', 'max:20'],
        ];
    }
}
