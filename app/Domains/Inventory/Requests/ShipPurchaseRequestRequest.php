<?php

namespace App\Domains\Inventory\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ShipPurchaseRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'shipment_date'          => 'nullable|date',
            'tracking_number'        => 'nullable|string',
            'expected_delivery_date' => 'nullable|date',
        ];
    }
}
