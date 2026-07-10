<?php

namespace App\Domains\Laboratory\Requests;

use App\Domains\Laboratory\Models\ReportTemplate;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Facades\Gate;

class UpdateReportTemplateRequest extends StoreReportTemplateRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Gate::allows('update', $this->routeReportTemplateModel());
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $rules = parent::rules();
        $rules['name'] = ['required', 'string', 'max:255', 'unique:report_templates,name,'.$this->routeReportTemplateModel()->id];
        $rules['parameters.*.id'] = ['nullable'];

        return $rules;
    }

    private function routeReportTemplateModel(): ReportTemplate
    {
        /** @var ReportTemplate $model */
        $model = $this->route('reportTemplate');

        return $model;
    }
}
