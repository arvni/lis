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
        return Gate::allows("update", $this->routeSampleTypeModel());
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            "name" => ["string", "required", "unique:sample_types,name," . $this->routeSampleTypeModel()->id],
            "description" => ["nullable", "string"],
            "orderable" => ["nullable", "boolean"],
            "required_barcode" => ["nullable", "boolean"],
        ];
    }

    private function routeSampleTypeModel(): \App\Domains\Laboratory\Models\SampleType
    {
        /** @var \App\Domains\Laboratory\Models\SampleType $model */
        $model = $this->route('sampleType');

        return $model;
    }
}
