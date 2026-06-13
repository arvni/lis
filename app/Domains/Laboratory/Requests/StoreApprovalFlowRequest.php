<?php

namespace App\Domains\Laboratory\Requests;

use App\Domains\Laboratory\Models\ApprovalFlow;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class StoreApprovalFlowRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Gate::allows("create", ApprovalFlow::class);
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            "name" => ["required", "string", "max:255"],
            "description" => ["nullable", "string"],
            "active" => ["boolean"],
            "steps" => ["required", "array", "min:1"],
            "steps.*.name" => ["required", "string", "max:255"],
            "steps.*.role_id" => ["nullable", "exists:roles,id"],
            "steps.*.user_id" => ["nullable", "exists:users,id"],
            "steps.*.allow_self_approval" => ["boolean"],
        ];
    }

    /**
     * Map SelectSearch objects ({id, name}) to plain foreign keys.
     */
    protected function prepareForValidation(): void
    {
        $steps = $this->input("steps");
        if (!is_array($steps))
            return;

        foreach ($steps as $key => $step) {
            if (isset($step["role"]["id"]) && !isset($step["role_id"]))
                $steps[$key]["role_id"] = $step["role"]["id"];
            if (isset($step["user"]["id"]) && !isset($step["user_id"]))
                $steps[$key]["user_id"] = $step["user"]["id"];
        }

        $this->merge(["steps" => $steps]);
    }
}
