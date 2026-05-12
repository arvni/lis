<?php

namespace App\Domains\Inventory\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreReceiptRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'store_id'                   => 'required|exists:stores,id',
            'notes'                      => 'nullable|string',
            'lines'                      => 'required|array|min:1',
            'lines.*.pr_line_id'         => 'required|exists:purchase_request_lines,id',
            'lines.*.qty'                => 'required|numeric|min:0.000001',
            'lines.*.lot_number'         => 'nullable|string',
            'lines.*.brand'              => 'nullable|string',
            'lines.*.cat_no'             => 'nullable|string',
            'lines.*.expiry_date'        => 'nullable|date',
            'lines.*.store_location_id'  => 'nullable|exists:store_locations,id',
            'lines.*.unit_price'         => 'nullable|numeric|min:0',
            'lines.*.barcode'            => 'nullable|string|max:255',
        ];
    }
}
