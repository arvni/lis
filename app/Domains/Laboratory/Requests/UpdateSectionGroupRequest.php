<?php

namespace App\Domains\Laboratory\Requests;

use App\Domains\Laboratory\Models\SectionGroup;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Facades\Gate;

class UpdateSectionGroupRequest extends StoreSectionGroupRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Gate::allows('update', $this->routeSectionGroupModel());
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $rules = parent::rules();
        $rules['name'] = ['required', 'unique:section_groups,name,'.$this->routeSectionGroupModel()->id];

        return $rules;
    }

    private function routeSectionGroupModel(): SectionGroup
    {
        /** @var SectionGroup $model */
        $model = $this->route('sectionGroup');

        return $model;
    }
}
