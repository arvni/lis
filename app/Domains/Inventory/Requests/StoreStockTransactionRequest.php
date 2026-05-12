<?php

namespace App\Domains\Inventory\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreStockTransactionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'transaction_type'           => 'required|string',
            'transaction_date'           => 'required|date',
            'store_id'                   => 'required|exists:stores,id',
            'destination_store_id'       => 'nullable|exists:stores,id',
            'supplier_id'                => 'nullable|exists:suppliers,id',
            'notes'                      => 'nullable|string',
            'lines'                      => 'required|array|min:1',
            'lines.*.item_id'            => 'required|exists:items,id',
            'lines.*.unit_id'            => 'required|exists:units,id',
            'lines.*.quantity'           => 'required|numeric|min:0.000001',
            'lines.*.lot_number'         => 'nullable|string',
            'lines.*.brand'              => 'nullable|string',
            'lines.*.cat_no'             => 'nullable|string',
            'lines.*.barcode'            => 'nullable|string',
            'lines.*.expiry_date'        => 'nullable|date',
            'lines.*.unit_price'         => 'nullable|numeric|min:0',
            'lines.*.store_location_id'  => 'nullable|exists:store_locations,id',
            'lines.*.notes'              => 'nullable|string',
        ];
    }
}
