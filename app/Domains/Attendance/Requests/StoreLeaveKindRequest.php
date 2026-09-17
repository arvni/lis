<?php

declare(strict_types=1);

namespace App\Domains\Attendance\Requests;

use App\Domains\Attendance\Models\LeaveKind;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class StoreLeaveKindRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('create', LeaveKind::class);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:100', Rule::unique('leave_kinds', 'name')->ignore($this->route('leave_kind'))],
            // Whether time off of this kind is still paid; the salary slip deducts the rest.
            'is_paid' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    protected function prepareForValidation(): void
    {
        foreach (['is_paid', 'is_active'] as $flag) {
            if ($this->has($flag) && is_string($this->{$flag})) {
                $this->merge([$flag => filter_var($this->{$flag}, FILTER_VALIDATE_BOOLEAN)]);
            }
        }
    }
}
