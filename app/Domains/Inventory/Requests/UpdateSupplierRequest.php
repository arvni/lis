<?php

namespace App\Domains\Inventory\Requests;

use App\Domains\Inventory\Models\Supplier;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSupplierRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        /** @var Supplier $supplier */
        $supplier = $this->route('supplier');

        return [
            'name'                    => 'required|string|max:255',
            'code'                    => ['required', 'string', Rule::unique('suppliers', 'code')->ignore($supplier->id)],
            'type'                    => 'required|string',
            'country'                 => 'nullable|string',
            'city'                    => 'nullable|string',
            'address'                 => 'nullable|string',
            'website'                 => 'nullable|url',
            'payment_terms'           => 'nullable|string',
            'lead_time_days'          => 'nullable|integer|min:0',
            'is_active'               => 'boolean',
            'notes'                   => 'nullable|string',
            'tax_number'              => 'nullable|string',
            'commercial_registration' => 'nullable|string',
            'contacts'                => 'nullable|array',
            'contacts.*.name'         => 'required|string',
            'contacts.*.email'        => 'nullable|email',
            'contacts.*.phone'        => 'nullable|string',
            'contacts.*.mobile'       => 'nullable|string',
            'contacts.*.is_primary'   => 'boolean',
        ];
    }
}
