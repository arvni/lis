<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\Requests;

use Illuminate\Foundation\Http\FormRequest;

/** Any review action that only needs an optional reason or note: drop a test, close a request, hold. */
class PreOrderReasonRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('review', $this->route('preOrder')) ?? false;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'reason' => ['nullable', 'string', 'max:1000'],
            'declined' => ['boolean'],
        ];
    }
}
