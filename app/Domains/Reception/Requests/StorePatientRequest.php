<?php

namespace App\Domains\Reception\Requests;

use App\Domains\Reception\Models\Patient;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

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
        $id=$this->input("id");
        return [
            "id"=>["nullable","exists:patients,id"],
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
                "unique:patients,idNo".($id ? ",$id" : ''),
                "max:255"
            ],
            "nationality" => [
                "required",
            ],
            "phone" => [
                "required",
                "string",
                "max:255",
                "unique:patients,phone".($id ? ",$id" : ''),
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
