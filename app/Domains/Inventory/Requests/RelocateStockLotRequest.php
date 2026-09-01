<?php

declare(strict_types=1);

namespace App\Domains\Inventory\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RelocateStockLotRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'quantity_base_units' => 'required|numeric|gt:0',
            'to_store_id' => 'required|integer|exists:stores,id',
            'to_store_location_id' => 'nullable|integer|exists:store_locations,id',
            'notes' => 'nullable|string|max:500',
        ];
    }

    public function messages(): array
    {
        return [
            'quantity_base_units.gt' => 'Enter how much stock to move — it must be greater than zero.',
            'to_store_id.required' => 'Choose the store the stock is moving to.',
        ];
    }
}
