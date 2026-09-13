<?php

declare(strict_types=1);

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
            // A line names a catalogue item or, for something not in the catalogue yet,
            // a typed item_name — which is linked to a real item when it is received.
            'lines.*.item_id'               => 'nullable|required_without:lines.*.item_name|exists:items,id',
            'lines.*.item_name'             => 'nullable|required_without:lines.*.item_id|string|max:255',
            'lines.*.unit_id'               => 'required|exists:units,id',
            'lines.*.qty'                   => 'required|numeric|min:0.000001',
            'lines.*.preferred_supplier_id' => 'nullable|exists:suppliers,id',
            'lines.*.estimated_unit_price'  => 'nullable|numeric|min:0',
            'lines.*.cat_no'                => 'nullable|string',
            'lines.*.brand'                 => 'nullable|string',
            'lines.*.notes'                 => 'nullable|string',
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'lines.*.item_id.required_without'   => 'Select an item or type its name.',
            'lines.*.item_name.required_without' => 'Type the item name or pick it from the catalogue.',
        ];
    }
}
