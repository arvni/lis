<?php

declare(strict_types=1);

namespace App\Domains\Reception\Requests;

use App\Domains\Reception\Models\AcceptanceItemState;
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
        /** @var AcceptanceItemState $state */
        $state = $this->route("acceptanceItemState");
        $section = $state->load("section")->section;
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
