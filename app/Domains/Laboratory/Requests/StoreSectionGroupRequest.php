<?php

namespace App\Domains\Laboratory\Requests;

use App\Domains\Laboratory\Models\SectionGroup;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class StoreSectionGroupRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Gate::allows("create", SectionGroup::class);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            "name" => ["required", "unique:section_groups,name"],
            "active" => ["bool"],
            "parent" => ["nullable","array"],
            "parent.id" => ["nullable", "exists:section_groups,id"],
        ];
    }
}
