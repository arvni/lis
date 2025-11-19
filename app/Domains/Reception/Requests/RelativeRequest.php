<?php

namespace App\Domains\Reception\Requests;

use App\Domains\Reception\Models\Patient;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class RelativeRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Gate::allows("create", Patient::class);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $id=$this->input("id");
        return [
            "id"=>[
                "nullable","exists:patients,id",
            ],
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
            "relationship" => [
                "required",
                "array",
                "max:255"
            ],
            "relative_id" => [
                "nullable",
                "integer",
                "exists:patients,id"
            ],
            "reference_id" => [
                "nullable",
            ],
            "patient_id" => [
                "required",
                "integer",
                "exists:patients,id",
                "different:relative_id"
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
