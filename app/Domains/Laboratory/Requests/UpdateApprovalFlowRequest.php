<?php

namespace App\Domains\Laboratory\Requests;

use Illuminate\Support\Facades\Gate;

class UpdateApprovalFlowRequest extends StoreApprovalFlowRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Gate::allows("update", $this->route()->parameter("approvalFlow"));
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return array_merge(parent::rules(), [
            "steps.*.id" => ["nullable", "integer", "exists:approval_flow_steps,id"],
        ]);
    }
}
