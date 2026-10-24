<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\Requests;

use App\Domains\PreOrder\Enums\ExceptionType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ClosePreOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('review', $this->route('preOrder')) ?? false;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'type' => ['required', Rule::in([ExceptionType::CANCELLED->value, ExceptionType::NOT_ELIGIBLE->value, ExceptionType::NOT_PROCEEDING->value])],
            'reason' => ['required', 'string', 'max:64'],
            'comment' => ['required', 'string', 'max:2000'],
            'override' => ['boolean'],
        ];
    }
}
