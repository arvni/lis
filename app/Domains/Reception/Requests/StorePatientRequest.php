<?php

namespace App\Domains\Reception\Requests;

use App\Domains\Reception\Models\Patient;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class StorePatientRequest extends FormRequest
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
        $id = $this->input("id") ?? $this->input("patient.id");
        return [
            "id" => ["nullable", "exists:patients,id"],
            "patient.id" => ["nullable", "exists:patients,id"],
            "avatar" => [
                Rule::requiredIf(!$id),
            ],
            "dateOfBirth" => [
                Rule::requiredIf(!$id),
                "date",
                "before:today"
            ],
            "fullName" => [
                "nullable",
                "string",
                "max:255"],
            "firstName" => [
                Rule::requiredIf(!$id),
                "string",
                "max:255"],
            "lastName" => [
                Rule::requiredIf(!$id),
                "string",
                "max:255"],
            "secondName" => [
                Rule::requiredIf(!$id && $this->isOmani()),
                "nullable",
                "string",
                "max:255"],
            "thirdName" => [
                Rule::requiredIf(!$id && $this->isOmani()),
                "nullable",
                "string",
                "max:255"],
            "gender" => [
                Rule::requiredIf(!$id),
                "string",
            ],
            "idNo" => [
                Rule::requiredIf(!$id),
                "string",
                "unique:patients,idNo" . ($id ? ",$id" : ''),
                "max:255"
            ],
            "nationality" => [
                Rule::requiredIf(!$id),
            ],
            "phone" => [
                'nullable',
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
            "governorate" => [
                Rule::requiredIf(!$id && $this->isOmani()),
                "nullable",
                "string",
                "max:255"
            ],
            "wilayat" => [
                Rule::requiredIf(!$id && $this->isOmani()),
                "nullable",
                "string",
                "max:255"
            ]
        ];
    }

    /**
     * Whether the submitted nationality is Omani. The frontend sends nationality
     * either as an object ({code: "OM"}) or as a plain code string.
     */
    private function isOmani(): bool
    {
        return $this->input("nationality.code") === "OM"
            || $this->input("nationality") === "OM";
    }
}
