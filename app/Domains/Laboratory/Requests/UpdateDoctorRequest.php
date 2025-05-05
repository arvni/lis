<?php

namespace App\Domains\Laboratory\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class UpdateDoctorRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Gate::allows("update", $this->route()->parameter("barcodeGroup"));
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            "name" => [
                "required",
                "string",
                "unique:doctors,name," . $this->route()->parameter("doctor")->id
            ],
            "expertise" => ["nullable"],
            "phone" => ["nullable"],
            "license_no" => ["nullable"]
        ];
    }
}
