<?php

namespace App\Domains\Inventory\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreWorkflowTemplateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'                         => 'required|string|max:255',
            'description'                  => 'nullable|string',
            'is_active'                    => 'boolean',
            'is_default'                   => 'boolean',
            'priority'                     => 'integer|min:0',
            'conditions'                   => 'nullable|array',
            'conditions.urgencies'         => 'nullable|array',
            'conditions.urgencies.*'       => 'string',
            'conditions.requester_roles'   => 'nullable|array',
            'conditions.requester_roles.*' => 'string',
            'conditions.min_total'         => 'nullable|numeric|min:0',
            'steps'                        => 'present|array',
            'steps.*.name'                 => 'required|string|max:255',
            'steps.*.sort_order'           => 'required|integer|min:0',
            'steps.*.approver_user_id'     => 'nullable|exists:users,id',
            'steps.*.approver_role'        => 'nullable|string',
        ];
    }
}
