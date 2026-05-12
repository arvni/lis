<?php

namespace App\Domains\Referrer\Requests;

use App\Domains\Referrer\Enums\CollectRequestStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class UpdateCollectRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('update', $this->route('collect_request'));
    }

    public function rules(): array
    {
        return [
            'sample_collector_id'  => 'required|exists:sample_collectors,id',
            'referrer_id'          => 'required|exists:referrers,id',
            'preferred_date'       => 'nullable|date',
            'note'                 => 'nullable|string',
            'logistic_information' => 'nullable|array',
            'status'               => ['nullable', 'string', Rule::in(CollectRequestStatus::values())],
            'barcode'              => [
                'nullable', 'string',
                Rule::unique('collect_requests', 'barcode')->ignore($this->route('collect_request')),
            ],
        ];
    }
}
