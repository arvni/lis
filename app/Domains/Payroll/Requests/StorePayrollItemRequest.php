<?php

declare(strict_types=1);

namespace App\Domains\Payroll\Requests;

use App\Domains\Payroll\Enums\PayrollCalculation;
use App\Domains\Payroll\Models\PayrollItem;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Enum;

class StorePayrollItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('create', PayrollItem::class);
    }

    /**
     * Each shape needs its own figures and ignores the others, so the rules are conditional on the
     * calculation rather than demanding everything at once.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'user_id' => ['required', 'integer', Rule::exists('users', 'id')],
            'payroll_item_type_id' => ['required', 'integer', Rule::exists('payroll_item_types', 'id')],
            'calculation' => ['required', new Enum(PayrollCalculation::class)],

            'amount' => ['exclude_unless:calculation,FIXED', 'required', 'numeric', 'min:0', 'max:99999999999999999'],
            'percentage' => ['exclude_unless:calculation,PERCENTAGE', 'required', 'numeric', 'gt:0', 'max:100'],
            'total_amount' => ['exclude_unless:calculation,INSTALLMENTS', 'required', 'numeric', 'gt:0', 'max:99999999999999999'],
            'installments' => ['exclude_unless:calculation,INSTALLMENTS', 'required', 'integer', 'min:1', 'max:600'],

            'start_date' => ['required', 'date_format:Y-m-d'],
            // Instalments end when they are paid off, so an end date would only contradict them.
            'end_date' => ['exclude_if:calculation,INSTALLMENTS', 'nullable', 'date_format:Y-m-d', 'after_or_equal:start_date'],

            'notes' => ['nullable', 'string', 'max:500'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:65535'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'percentage.gt' => 'A percentage of nothing would never deduct anything — give a figure above 0.',
            'installments.min' => 'A loan needs at least one instalment.',
        ];
    }
}
