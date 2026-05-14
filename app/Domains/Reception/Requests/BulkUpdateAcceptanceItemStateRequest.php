<?php

namespace App\Domains\Reception\Requests;

use App\Domains\Reception\Models\AcceptanceItemState;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class BulkUpdateAcceptanceItemStateRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        if (!$this->has('ids') || !is_array($this->get('ids')) || count($this->get('ids')) === 0) {
            return false;
        }

        // Check the first one, assuming they are in the same section
        $firstState = AcceptanceItemState::with('section')->find($this->get('ids')[0]);
        if (!$firstState) return false;

        return Gate::allows("action", [$firstState->section, $this->get("actionType")]);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            "ids" => ["required", "array"],
            "ids.*" => ["required", "exists:acceptance_item_states,id"],
            "parameters.*.value" => ["nullable"],
            "parameters.*.name" => ["required"],
            "parameters.*.type" => ["required"],
            "actionType" => ["required", "in:Update,rejected,finished"],
            "details" => ["required_if:actionType,rejected"],
            "next" => ["required_if:actionType,rejected"],
        ];
    }
}
