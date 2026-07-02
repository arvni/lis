<?php

namespace App\Domains\Laboratory\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class UpdateSectionGroupRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Gate::allows("update",$this->routeSectionGroupModel());
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            "name" => ["required", "unique:section_groups,name,".$this->routeSectionGroupModel()->id],
            "active" => ["bool"],
            "parent" => ["nullable","array"],
            "parent.id" => ["nullable", "exists:section_groups,id"],
        ];
    }

    private function routeSectionGroupModel(): \App\Domains\Laboratory\Models\SectionGroup
    {
        /** @var \App\Domains\Laboratory\Models\SectionGroup $model */
        $model = $this->route('sectionGroup');

        return $model;
    }
}
