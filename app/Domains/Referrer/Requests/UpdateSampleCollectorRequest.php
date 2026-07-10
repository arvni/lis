<?php

namespace App\Domains\Referrer\Requests;

use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class UpdateSampleCollectorRequest extends StoreSampleCollectorRequest
{
    public function authorize(): bool
    {
        return Gate::allows('update', $this->route('sample_collector'));
    }

    public function rules(): array
    {
        $rules = parent::rules();
        $rules['email'] = [
            'required', 'email', 'max:255',
            Rule::unique('sample_collectors', 'email')->ignore($this->route('sample_collector')),
        ];

        return $rules;
    }
}
