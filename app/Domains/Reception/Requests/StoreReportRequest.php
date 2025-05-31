<?php

namespace App\Domains\Reception\Requests;

use App\Domains\Laboratory\Models\ReportTemplate;
use App\Domains\Laboratory\Models\ReportTemplateParameter;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class StoreReportRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Gate::allows('create', ReportTemplate::class);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        // Fetch template ID directly from the input
        $templateId = $this->input('report_template_id');
        $template = null;

        if ($templateId) {
            $template = ReportTemplate::with('parameters')
                ->withCount('parameters')
                ->findOrFail($templateId);
        }
        // Basic rules for document uploads
        $rules = [
            'report_template_id' => 'required|exists:report_templates,id',

            'reported_document' => [
                Rule::excludeIf(fn() => $template && $template->parameters_count > 0),
                'required', 'array'
            ], // 10MB max
            'reported_document.id' => [
                Rule::excludeIf(fn() => $template && $template->parameters_count > 0),
                'required', 'exists:documents,hash'
            ], // 10MB max
            'approved_document' => 'nullable|file|mimes:doc,docx|max:10240',
            'published_document' => 'nullable|file|mimes:pdf|max:10240',

            // Supporting files validation
            'files' => 'nullable|array',
            'files.*' => 'file|max:20480', // 20MB max for supporting files

            // Signers validation if included
            'signers' => 'nullable|array',
            'signers.*.user_id' => 'required|exists:users,id',

            'patient_id' => 'required|exists:patients,id',
        ];

        // Add dynamic parameter rules if we have a template
        if ($template && $template->parameters) {
            foreach ($template->parameters as $parameter) {
                if (!$parameter->active) {
                    continue;
                }

                $paramId = $this->getParameterKey($parameter);
                $rules[$paramId] = $this->getParameterRule($parameter);
            }
        }

        return $rules;
    }

    /**
     * Generate consistent parameter keys
     *
     * @param ReportTemplateParameter $parameter
     * @return string Formatted parameter key
     */
    protected function getParameterKey(ReportTemplateParameter $parameter): string
    {
        return "parameters." . str_replace([' ', '-'], '_', strtolower($parameter->title) . '_' . $parameter->id);
    }

    /**
     * Get validation rule for a specific parameter based on its type
     *
     * @param object $parameter The parameter object from the template
     * @return array The validation rules
     */
    protected function getParameterRule($parameter): array
    {
        $rules = [];

        // Add required/nullable rule
        if ($parameter->required) {
            $rules[] = 'required';
        } else {
            $rules[] = 'nullable';
        }

        // Add type-specific rules
        switch ($parameter->type) {
            case 'text':
                $rules[] = 'string';
                $rules[] = 'max:255';
                break;

            case 'number':
                $rules[] = 'numeric';
                break;

            case 'date':
                $rules[] = 'date';
                break;

            case 'select':
                $rules[] = 'string';
                if (!empty($parameter->custom_props)) {
                    $options = array_map('trim', explode(',', $parameter->custom_props));
                    $rules[] = Rule::in($options);
                }
                break;

            case 'checkbox':
                if (strpos($parameter->custom_props ?? '', ',') !== false) {

                } else {
                    // Single checkbox (boolean)
                    $rules[] = 'boolean';
                }
                break;

            case 'image':
                $rules[] = 'image';
                $rules[] = 'max:5120'; // 5MB max
                break;

            default:
                // No additional rules for unknown types
                break;
        }

        return $rules;
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array
     */
    public function messages(): array
    {
        $messages = [
            'report_template_id.required' => 'A report template is required.',
            'reported_document.required' => 'A reported document is required.',
            'reported_document.mimes' => 'The reported document must be a Word document (.doc or .docx).',
            'approved_document.mimes' => 'The approved document must be a Word document (.doc or .docx).',
            'published_document.mimes' => 'The published document must be a PDF file.',
            'patient_id.required' => 'A patient must be associated with this report.',
            'patient_id.exists' => 'The selected patient does not exist in our records.',
        ];

        // Dynamically add messages for parameters
        $templateId = $this->input('report_template_id');
        if ($templateId) {
            $template = ReportTemplate::with('parameters')->find($templateId);

            if ($template && $template->parameters) {
                foreach ($template->parameters as $parameter) {
                    if (!$parameter->active) {
                        continue;
                    }

                    $paramId = $this->getParameterKey($parameter);
                    $title = $parameter->title;

                    // Base messages
                    $messages["$paramId.required"] = "The $title field is required.";

                    // Type-specific messages
                    switch ($parameter->type) {
                        case 'number':
                            $messages["$paramId.numeric"] = "The $title must be a number.";
                            break;
                        case 'date':
                            $messages["$paramId.date"] = "The $title must be a valid date.";
                            break;
                        case 'select':
                            $messages["$paramId.in"] = "The selected $title is invalid.";
                            break;
                        case 'image':
                            $messages["$paramId.image"] = "The $title must be an image.";
                            $messages["$paramId.max"] = "The $title may not be greater than 5MB.";
                            break;
                    }
                }
            }
        }

        return $messages;
    }

    /**
     * Prepare the data for validation.
     *
     * @return void
     */
    protected function prepareForValidation(): void
    {
        // Fix inconsistency if user provides report_template instead of report_template_id
        if ($this->has('report_template') && is_array($this->input('report_template')) && isset($this->input('report_template')['id'])) {
            $this->merge([
                'report_template_id' => $this->input('report_template')['id']
            ]);
        }

        // Convert patientID to patient_id if provided
        if ($this->has('patientID') && !$this->has('patient_id')) {
            $this->merge([
                'patient_id' => $this->input('patientID')
            ]);
        }
    }
}
