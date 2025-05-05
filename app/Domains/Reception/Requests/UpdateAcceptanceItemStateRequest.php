<?php

namespace App\Domains\Reception\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class UpdateAcceptanceItemStateRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $section = $this->route()->parameter("acceptanceItemState")->load("section")->section;
        return Gate::allows("action", [$section,$this->get("actionType")]);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            "parameters.*.value" => ["nullable"],
            "parameters.*.name" => ["required"],
            "parameters.*.type" => ["required"],
            "actionType" => ["required", "in:Update,rejected,finished"],
            "details" => ["required_if:actionType,reject"],
            "next" => ["required_if:actionType,reject"],
        ];
    }
}
