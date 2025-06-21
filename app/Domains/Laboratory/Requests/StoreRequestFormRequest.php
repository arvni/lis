<?php

namespace App\Domains\Laboratory\Requests;

use App\Domains\Laboratory\Models\RequestForm;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class StoreRequestFormRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Gate::allows("create", RequestForm::class);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
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
            "name" => "required|unique:request_forms,name",
            "document" => ["nullable", "array"],
            "document.id" => ["nullable", "exists:documents,hash"],
        ];
    }
}
