<?php

namespace App\Domains\Laboratory\Requests;

use App\Domains\Laboratory\Models\Section;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class StoreSectionRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Gate::allows("create", Section::class);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            "name" => ["required", "unique:sections"],
            "active" => ["bool"],
            "description" => ["nullable", "string"],
            "section_group.id" => ["required", "exists:section_groups,id"],
            "section_group" => ["array"],
            "icon" => ["nullable", "string"],
        ];
    }
}
