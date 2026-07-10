<?php

namespace App\Domains\Laboratory\Requests;

use App\Domains\Laboratory\Models\SampleType;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Facades\Gate;

class UpdateSampleTypeRequest extends StoreSampleTypeRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Gate::allows('update', $this->routeSampleTypeModel());
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $rules = parent::rules();
        $rules['name'] = ['required', 'string', 'unique:sample_types,name,'.$this->routeSampleTypeModel()->id];

        return $rules;
    }

    private function routeSampleTypeModel(): SampleType
    {
        /** @var SampleType $model */
        $model = $this->route('sampleType');

        return $model;
    }
}
