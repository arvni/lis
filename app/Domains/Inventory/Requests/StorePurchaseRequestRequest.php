<?php

namespace App\Domains\Inventory\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePurchaseRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'urgency'                       => 'required|in:LOW,NORMAL,HIGH,URGENT',
            'notes'                         => 'nullable|string',
            'lines'                         => 'required|array|min:1',
            'lines.*.item_id'               => 'required|exists:items,id',
            'lines.*.unit_id'               => 'required|exists:units,id',
            'lines.*.qty'                   => 'required|numeric|min:0.000001',
            'lines.*.preferred_supplier_id' => 'nullable|exists:suppliers,id',
            'lines.*.estimated_unit_price'  => 'nullable|numeric|min:0',
            'lines.*.cat_no'                => 'nullable|string',
            'lines.*.brand'                 => 'nullable|string',
            'lines.*.notes'                 => 'nullable|string',
        ];
    }
}
