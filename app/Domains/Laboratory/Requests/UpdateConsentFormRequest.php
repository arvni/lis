<?php

namespace App\Domains\Laboratory\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class UpdateConsentFormRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Gate::allows("update", $this->routeConsentFormModel());
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            "name" => ["required", "string", "max:255", "unique:consent_forms,name," . $this->routeConsentFormModel()->id],
            "document" => ["required", "array"],
            "document.id" => ["required", "exists:documents,hash"],
        ];
    }

    private function routeConsentFormModel(): \App\Domains\Laboratory\Models\ConsentForm
    {
        /** @var \App\Domains\Laboratory\Models\ConsentForm $model */
        $model = $this->route('consentForm');

        return $model;
    }
}
