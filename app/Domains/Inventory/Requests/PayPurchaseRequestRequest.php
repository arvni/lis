<?php

namespace App\Domains\Inventory\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PayPurchaseRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'payment_date'      => 'required|date',
            'payment_reference' => 'nullable|string',
            'payment_file'      => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
        ];
    }
}
