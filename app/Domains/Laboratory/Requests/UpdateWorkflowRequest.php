<?php

namespace App\Domains\Laboratory\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class UpdateWorkflowRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Gate::allows("update", $this->routeWorkflowModel());
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            "name" => ["required", "string", "unique:workflows,name," . $this->routeWorkflowModel()->id],
            "description" => ["nullable", "string"],
            "status" => ["boolean"],
            "section_workflows" => ["required", "array", "min:1"],
            "section_workflows.*.id" => ["required"],
            "section_workflows.*.section.id" => ["required", "exists:sections,id"],
            "section_workflows.*.parameters" => ["required", "array", "min:1"],
            "section_workflows.*.parameters.*.name" => ["required", "string"],
            "section_workflows.*.parameters.*.type" => ["required", "in:text,date,time,number,options,file"],
        ];
    }

    private function routeWorkflowModel(): \App\Domains\Laboratory\Models\Workflow
    {
        /** @var \App\Domains\Laboratory\Models\Workflow $model */
        $model = $this->route('workflow');

        return $model;
    }
}
