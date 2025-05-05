<?php

namespace App\Domains\Laboratory\Requests;

use App\Domains\Laboratory\Models\ReportTemplate;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class StoreReportTemplateRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Gate::allows("create", ReportTemplate::class);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            "name" => ["required", "string", "max:255", "unique:report_templates,name"],
            "template" => ["required", "array"],
            "template.id" => ["required", "exists:documents,hash"],
            'parameters.*.type'=> ['required', 'string', 'max:255'],
            'parameters.*.title'=> ['required', 'string', 'max:255'],
            'parameters.*.required'=> ['required', 'boolean'],
            'parameters.*.active'=> ['required', 'boolean'],
            'parameters.*.custom_props'=> ['nullable','string'],
        ];
    }
}
