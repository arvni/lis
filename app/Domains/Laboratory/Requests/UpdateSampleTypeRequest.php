<?php

namespace App\Domains\Laboratory\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class UpdateSampleTypeRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Gate::allows("update", $this->route()->parameter("sampleType"));
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            "name" => ["string", "required", "unique:sample_types,name," . $this->route()->parameter("sampleType")->id],
            "description" => ["nullable", "string"],
            "orderable" => ["nullable", "boolean"],
            "required_barcode" => ["nullable", "boolean"],
        ];
    }
}
