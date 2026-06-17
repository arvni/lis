<?php

namespace App\Domains\Reception\Requests;

use App\Domains\Reception\Models\Patient;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class MergePatientsRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Gate::allows("merge", Patient::class);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            "keep_id" => [
                "required",
                "integer",
                "exists:patients,id",
            ],
            "remove_id" => [
                "required",
                "integer",
                "different:keep_id",
                "exists:patients,id",
            ],
            "attributes" => [
                "nullable",
                "array",
            ],
            "attributes.*" => [
                "nullable",
            ],
            "meta" => [
                "nullable",
                "array",
            ],
            "meta.*" => [
                "nullable",
            ],
        ];
    }
}
