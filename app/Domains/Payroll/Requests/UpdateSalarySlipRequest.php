<?php

declare(strict_types=1);

namespace App\Domains\Payroll\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class UpdateSalarySlipRequest extends FormRequest
{
    public function authorize(): bool
    {
        // The route declares {salarySlip}; a hand-written route keeps the name as spelled, unlike
        // Route::resource which would underscore it.
        return Gate::allows('update', $this->route('salarySlip'));
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'lines' => ['present', 'array', 'max:100'],
            'lines.*.code' => ['nullable', 'string', 'max:20'],
            'lines.*.label' => ['required', 'string', 'max:150'],
            // Signed: a deduction is negative, so the net is simply the sum.
            'lines.*.amount' => ['required', 'numeric', 'min:-99999999999999999', 'max:99999999999999999'],
            'lines.*.note' => ['nullable', 'string', 'max:255'],
            // Carried through so a loan's instalment stays attributed to the item that produced it.
            'lines.*.payroll_item_id' => ['nullable', 'integer', Rule::exists('payroll_items', 'id')],
            'lines.*.installment_number' => ['nullable', 'integer', 'min:1', 'max:600'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
