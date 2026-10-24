<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\Requests;

use App\Domains\PreOrder\Enums\RequestType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RaisePreOrderRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('review', $this->route('preOrder')) ?? false;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'types' => ['required', 'array', 'min:1'],
            'types.*' => ['required', 'distinct', Rule::enum(RequestType::class)],
            'reason' => ['required', 'string', 'max:64'],
            'message' => ['required', 'string', 'max:5000'],
            'blocking' => ['boolean'],
            'due_at' => ['nullable', 'date', 'after:today'],
            'needs' => ['nullable', 'array'],
            'needs.samples' => ['nullable', 'array', 'max:10'],
            'needs.samples.*.patient_ref' => ['nullable', 'string', 'max:64'],
            'needs.samples.*.sample_type' => ['required', 'string', 'max:100'],
            'needs.samples.*.count' => ['required', 'integer', 'min:1', 'max:20'],
            'needs.documents' => ['nullable', 'array', 'max:10'],
            'needs.documents.*' => ['string', 'max:64'],
        ];
    }
}
