<?php

namespace App\Domains\Laboratory\Requests;

use App\Domains\Laboratory\Models\ConsentForm;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Facades\Gate;

class UpdateConsentFormRequest extends StoreConsentFormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Gate::allows('update', $this->routeConsentFormModel());
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $rules = parent::rules();
        $rules['name'] = ['required', 'string', 'max:255', 'unique:consent_forms,name,'.$this->routeConsentFormModel()->id];

        return $rules;
    }

    private function routeConsentFormModel(): ConsentForm
    {
        /** @var ConsentForm $model */
        $model = $this->route('consentForm');

        return $model;
    }
}
