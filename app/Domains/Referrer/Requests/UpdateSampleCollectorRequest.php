<?php

namespace App\Domains\Referrer\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class UpdateSampleCollectorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('update', $this->route('sample_collector'));
    }

    public function rules(): array
    {
        return [
            'name'  => 'required|string|max:255',
            'email' => [
                'required', 'email', 'max:255',
                Rule::unique('sample_collectors', 'email')->ignore($this->route('sample_collector')),
            ],
        ];
    }
}
