<?php

namespace App\Domains\Laboratory\Requests;

use App\Domains\Laboratory\Models\Doctor;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Facades\Gate;

class UpdateDoctorRequest extends StoreDoctorRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Gate::allows('update', $this->routeDoctorModel());
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $rules = parent::rules();
        $rules['name'] = ['required', 'string', 'unique:doctors,name,'.$this->routeDoctorModel()->id];

        return $rules;
    }

    private function routeDoctorModel(): Doctor
    {
        /** @var Doctor $model */
        $model = $this->route('doctor');

        return $model;
    }
}
