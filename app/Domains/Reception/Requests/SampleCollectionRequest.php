<?php

namespace App\Domains\Reception\Requests;

use App\Domains\Reception\Models\Acceptance;
use Illuminate\Foundation\Http\FormRequest;

class SampleCollectionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('sampleCollection', Acceptance::class);
    }

    public function rules(): array
    {
        return [];
    }
}
