<?php

namespace App\Domains\Inventory\Requests;

use Illuminate\Foundation\Http\FormRequest;

class OrderPurchaseRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'po_number'   => 'required|string',
            'supplier_id' => 'required|exists:suppliers,id',
            'po_file'     => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
        ];
    }
}
