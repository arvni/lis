<?php

namespace App\Domains\Laboratory\Requests;

use App\Domains\Laboratory\Models\Workflow;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class StoreWorkflowRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Gate::allows("create", Workflow::class);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            "name" => ["required", "string","unique:workflows,name"],
            "description" => ["nullable", "string"],
            "status" => ["nullable","boolean"],
            "section_workflows" => ["required", "array", "min:1"],
            "section_workflows.*.section.id" => ["required", "exists:sections,id"],
            "section_workflows.*.parameters" => ["required", "array", "min:1"],
            "section_workflows.*.parameters.*.name" => ["required", "string"],
            "section_workflows.*.parameters.*.type" => ["required", "in:text,date,time,number,options,file"],
        ];
    }
}
