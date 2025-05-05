<?php

namespace App\Domains\Reception\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class UpdatePatientMetaRequest extends FormRequest
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
            "maritalStatus" => ["nullable", "boolean"],
            "company" => ["nullable", "string"],
            "profession" => ["nullable", "string"],
            "email" => ["nullable", "email"],
            "address" => ["nullable", "string"],
            "details" => ["nullable", "string"],
        ];
    }
}
