<?php

namespace App\Domains\Laboratory\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class UpdateRequestFormRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Gate::allows("update",$this->route()->parameter("requestForm"));
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            "form_data" => "required|array|min:1",
            "form_data.*.id" => "required",
            "form_data.*.label" => "required",
            "form_data.*.placeholder" => "nullable",
            "form_data.*.options" => "nullable|array",
            "form_data.*.required" => "nullable|boolean",
            "form_data.*.type" => ["required", Rule::in(["text", "number", "checkbox", "select", "date", "description"])],
            "name" => "required|unique:request_forms,name,".$this->route()->parameter("requestForm")->id,
            "document" => ["nullable", "array"],
            "document.id" => ["nullable", "exists:documents,hash"],
        ];
    }
}
