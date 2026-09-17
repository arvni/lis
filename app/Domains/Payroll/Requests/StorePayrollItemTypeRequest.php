<?php

declare(strict_types=1);

namespace App\Domains\Payroll\Requests;

use App\Domains\Payroll\Enums\AllowanceKind;
use App\Domains\Payroll\Models\PayrollItemType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Enum;

class StorePayrollItemTypeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('create', PayrollItemType::class);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:150', Rule::unique('payroll_item_types', 'name')->ignore($this->route('item_type'))],
            'kind' => ['required', new Enum(AllowanceKind::class)],
            // Optional: an item whose amount differs for everyone has no useful default.
            'default_amount' => ['nullable', 'numeric', 'min:0', 'max:99999999999999999'],
            'is_active' => 'boolean',
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('is_active') && is_string($this->is_active)) {
            $this->merge(['is_active' => filter_var($this->is_active, FILTER_VALIDATE_BOOLEAN)]);
        }
        if ($this->default_amount === '') {
            $this->merge(['default_amount' => null]);
        }
    }
}
