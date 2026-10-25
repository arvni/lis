<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\Requests;

use App\Domains\PreOrder\Models\Flow;
use Illuminate\Foundation\Http\FormRequest;

class CopyFlowRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('manage', Flow::class) ?? false;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
        ];
    }
}
