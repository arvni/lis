<?php

namespace App\Domains\Reception\Requests;

use App\Domains\Reception\Models\Patient;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class UpdateRelativeRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Relatives are patient records — mirror RelativeRequest (store).
        return Gate::allows("create", Patient::class);
    }

    public function rules(): array
    {
        return [
            'relationship' => ['required', 'array'],
        ];
    }
}
