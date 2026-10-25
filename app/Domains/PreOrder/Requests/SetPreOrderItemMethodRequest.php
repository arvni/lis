<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SetPreOrderItemMethodRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('review', $this->route('preOrder')) ?? false;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'method_test_id' => ['required', 'integer', 'exists:method_tests,id'],
        ];
    }
}
