<?php

declare(strict_types=1);

namespace App\Domains\Payroll\Requests;

use App\Domains\Payroll\Enums\EmploymentType;
use App\Domains\Payroll\Models\EmploymentContract;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Enum;

class StoreEmploymentContractRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('create', EmploymentContract::class);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'user_id' => ['required', 'integer', Rule::exists('users', 'id')],
            'position' => ['nullable', 'string', 'max:150'],
            'employment_type' => ['required', new Enum(EmploymentType::class)],
            'base_salary' => ['required', 'numeric', 'min:0', 'max:99999999999999999'],
            'overtime_multiplier' => ['required', 'numeric', 'min:0', 'max:99'],
            // Optional: someone whose hours genuinely vary can be left without one. The slip then
            // says so rather than pricing their overtime against invented hours.
            'shift_id' => ['nullable', 'integer', Rule::exists('shifts', 'id')],
            'start_date' => ['required', 'date_format:Y-m-d'],
            // Absent for an open-ended contract.
            'end_date' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:start_date'],
            'probation_end_date' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:start_date'],
            'reference' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string', 'max:2000'],

            'entitlements' => ['array'],
            'entitlements.*.leave_kind_id' => ['required', 'integer', Rule::exists('leave_kinds', 'id'), 'distinct'],
            'entitlements.*.entitled_days' => ['required', 'numeric', 'min:0', 'max:9999'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'entitlements.*.leave_kind_id.distinct' => 'Each leave kind can only be given an allowance once.',
        ];
    }
}
