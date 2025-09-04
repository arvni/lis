<?php

namespace App\Domains\Reception\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class UpdatePatientRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Gate::allows("update", $this->route()->parameter("patient"));
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            "avatar" => [
                "required",
            ],
            "dateOfBirth" => [
                "required",
                "date",
                "before:today"
            ],
            "fullName" => [
                "required",
                "string",
                "max:255"],
            "gender" => [
                "required",
                "string",
            ],
            "idNo" => [
                "required",
                "string",
                "unique:patients,idNo,".$this->route()->parameter("patient")->id,
                "max:255"
            ],
            "nationality" => [
                "required",
            ],
            "phone" => [
                "nullable",
                "string",
                "max:255",
            ],
            "tribe" => [
                "nullable",
                "string",
                "max:255"
            ],
            "village" => [
                "nullable",
                "string",
                "max:255"
            ],
            "wilayat" => [
                "nullable",
                "string",
                "max:255"
            ]
        ];
    }
}
