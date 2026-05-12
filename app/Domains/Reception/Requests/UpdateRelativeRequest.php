<?php

namespace App\Domains\Reception\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateRelativeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'relationship' => ['required', 'array'],
        ];
    }
}
