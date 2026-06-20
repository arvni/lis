<?php

namespace App\Domains\Inventory\Requests;

use Closure;
use Illuminate\Foundation\Http\FormRequest;

class StoreItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'scientific_name' => 'nullable|string|max:255',
            'department' => 'required|string',
            'material_type' => 'required|string',
            'description' => 'nullable|string',
            'storage_condition' => 'required|string',
            'storage_condition_notes' => 'nullable|string',
            'default_unit_id' => 'required|exists:units,id',
            'is_hazardous' => 'boolean',
            'requires_lot_tracking' => 'boolean',
            'minimum_stock_level' => 'numeric|min:0',
            'maximum_stock_level' => 'nullable|numeric|min:0',
            'lead_time_days' => 'nullable|integer|min:0',
            'notes' => 'nullable|string',
            'unit_conversions' => 'nullable|array',
            'unit_conversions.*.unit_id' => [
                'required',
                'distinct',
                'exists:units,id',
                function (string $attribute, mixed $value, Closure $fail): void {
                    if ((int) $value === (int) $this->input('default_unit_id')) {
                        $fail('A conversion unit cannot be the same as the default unit.');
                    }
                },
            ],
            'unit_conversions.*.conversion_to_base' => 'required|numeric|min:0.000001',
        ];
    }

    public function messages(): array
    {
        return [
            'unit_conversions.*.unit_id.distinct' => 'Each unit can only be used once in the conversions list.',
        ];
    }
}
