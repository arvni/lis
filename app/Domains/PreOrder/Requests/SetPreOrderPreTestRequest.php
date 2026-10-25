<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\Requests;

use Illuminate\Foundation\Http\FormRequest;

/** Mark a test line as a prerequisite, sent to the lab before the main tests. */
class SetPreOrderPreTestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('review', $this->route('preOrder')) ?? false;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'pre_test' => ['required', 'boolean'],
        ];
    }
}
