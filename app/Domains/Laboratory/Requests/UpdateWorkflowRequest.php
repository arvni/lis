<?php

namespace App\Domains\Laboratory\Requests;

use App\Domains\Laboratory\Models\Workflow;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Facades\Gate;

class UpdateWorkflowRequest extends StoreWorkflowRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Gate::allows('update', $this->routeWorkflowModel());
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $rules = parent::rules();
        $rules['name'] = ['required', 'string', 'unique:workflows,name,'.$this->routeWorkflowModel()->id];
        $rules['status'] = ['boolean'];
        $rules['section_workflows.*.id'] = ['required'];

        return $rules;
    }

    private function routeWorkflowModel(): Workflow
    {
        /** @var Workflow $model */
        $model = $this->route('workflow');

        return $model;
    }
}
