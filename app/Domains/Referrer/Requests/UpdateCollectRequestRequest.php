<?php

namespace App\Domains\Referrer\Requests;

use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class UpdateCollectRequestRequest extends StoreCollectRequestRequest
{
    public function authorize(): bool
    {
        return Gate::allows('update', $this->route('collect_request'));
    }

    public function rules(): array
    {
        $rules = parent::rules();
        $rules['barcode'] = [
            'nullable', 'string',
            Rule::unique('collect_requests', 'barcode')->ignore($this->route('collect_request')),
        ];

        return $rules;
    }
}
