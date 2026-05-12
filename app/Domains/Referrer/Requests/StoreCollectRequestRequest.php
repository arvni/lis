<?php

namespace App\Domains\Referrer\Requests;

use App\Domains\Referrer\Enums\CollectRequestStatus;
use App\Domains\Referrer\Models\CollectRequest;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class StoreCollectRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('create', CollectRequest::class);
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
            'barcode'              => 'nullable|string|unique:collect_requests,barcode',
        ];
    }
}
