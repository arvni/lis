<?php

namespace App\Domains\Laboratory\Requests;

use App\Domains\Laboratory\Models\RequestForm;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Facades\Gate;

class UpdateRequestFormRequest extends StoreRequestFormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Gate::allows('update', $this->routeRequestFormModel());
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $rules = parent::rules();
        $rules['name'] = 'required|unique:request_forms,name,'.$this->routeRequestFormModel()->id;

        return $rules;
    }

    private function routeRequestFormModel(): RequestForm
    {
        /** @var RequestForm $model */
        $model = $this->route('requestForm');

        return $model;
    }
}
