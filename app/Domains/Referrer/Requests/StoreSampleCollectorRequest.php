<?php

namespace App\Domains\Referrer\Requests;

use App\Domains\Referrer\Models\SampleCollector;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class StoreSampleCollectorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('create', SampleCollector::class);
    }

    public function rules(): array
    {
        return [
            'name'  => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:sample_collectors,email',
        ];
    }
}
