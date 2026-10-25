<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\Requests;

use Illuminate\Foundation\Http\FormRequest;

/** A batch's samples can't be used; the center is asked for a replacement. */
class PreOrderSampleIssueRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('review', $this->route('preOrder')) ?? false;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'batch' => ['required', 'string', 'max:32'],
            'reason' => ['required', 'string', 'max:1000'],
        ];
    }
}
