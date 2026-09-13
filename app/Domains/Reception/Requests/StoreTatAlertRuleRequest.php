<?php

declare(strict_types=1);

namespace App\Domains\Reception\Requests;

use App\Domains\Reception\Models\TatAlertRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class StoreTatAlertRuleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('create', TatAlertRule::class);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'days_left' => 'required|integer|min:0|max:60',
            'active' => 'boolean',
            'tests' => 'required|array|min:1',
            'tests.*.id' => ['required', 'integer', Rule::exists('tests', 'id')],
            // A rule nobody receives is pointless: at least one user or one role.
            'users' => 'array|required_without:roles',
            'users.*.id' => ['required', 'integer', Rule::exists('users', 'id')],
            'roles' => 'array|required_without:users',
            'roles.*.id' => ['required', 'integer', Rule::exists('roles', 'id')],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'tests.required' => 'Select at least one test.',
            'users.required_without' => 'Select at least one user or role to notify.',
            'roles.required_without' => 'Select at least one user or role to notify.',
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('active') && is_string($this->active)) {
            $this->merge(['active' => filter_var($this->active, FILTER_VALIDATE_BOOLEAN)]);
        }
    }
}
