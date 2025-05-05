<?php

namespace App\Domains\Laboratory\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class UpdateSectionRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Gate::allows("update", $this->route()->parameter("section"));
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            "name" => ["required", "unique:sections,name,".$this->route()->parameter("section")->id],
            "active" => ["bool"],
            "description" => ["nullable", "string"],
            "section_group" => ["required","array"],
            "section_group.id" => ["required", "exists:section_groups,id"],
            "icon"=>["nullable","string"]
        ];
    }
}
