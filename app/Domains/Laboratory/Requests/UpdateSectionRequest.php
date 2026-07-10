<?php

namespace App\Domains\Laboratory\Requests;

use App\Domains\Laboratory\Models\Section;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Facades\Gate;

class UpdateSectionRequest extends StoreSectionRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Gate::allows('update', $this->routeSectionModel());
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $rules = parent::rules();
        $rules['name'] = ['required', 'unique:sections,name,'.$this->routeSectionModel()->id];
        $rules['section_group'] = ['required', 'array'];

        return $rules;
    }

    private function routeSectionModel(): Section
    {
        /** @var Section $model */
        $model = $this->route('section');

        return $model;
    }
}
