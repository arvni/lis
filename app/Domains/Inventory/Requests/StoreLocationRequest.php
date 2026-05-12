<?php

namespace App\Domains\Inventory\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreLocationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'zone'           => 'nullable|string|max:50',
            'row'            => 'nullable|string|max:50',
            'column'         => 'nullable|string|max:50',
            'shelf'          => 'nullable|string|max:50',
            'bin'            => 'nullable|string|max:50',
            'capacity_notes' => 'nullable|string',
        ];
    }
}
