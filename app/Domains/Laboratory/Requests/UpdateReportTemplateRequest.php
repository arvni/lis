<?php

namespace App\Domains\Laboratory\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class UpdateReportTemplateRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Gate::allows("update", $this->route()->parameter("reportTemplate"));
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            "name" => ["required", "string", "max:255", "unique:report_templates,name," . $this->route()->parameter("reportTemplate")->id],
            "template" => ["required", "array"],
            "template.id" => ["required", "exists:documents,hash"],
            'parameters.*.id'=> ['nullable'],
            'parameters.*.type'=> ['required', 'string', 'max:255'],
            'parameters.*.title'=> ['required', 'string', 'max:255'],
            'parameters.*.required'=> ['required', 'boolean'],
            'parameters.*.active'=> ['required', 'boolean'],
            'parameters.*.custom_props'=> ['nullable', 'string'],
        ];
    }
}
