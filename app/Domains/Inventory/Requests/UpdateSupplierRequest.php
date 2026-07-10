<?php

namespace App\Domains\Inventory\Requests;

use App\Domains\Inventory\Models\Supplier;
use Illuminate\Validation\Rule;

class UpdateSupplierRequest extends StoreSupplierRequest
{
    public function rules(): array
    {
        /** @var Supplier $supplier */
        $supplier = $this->route('supplier');

        $rules = parent::rules();
        $rules['code'] = ['required', 'string', Rule::unique('suppliers', 'code')->ignore($supplier->id)];
        $rules['is_active'] = 'boolean';

        return $rules;
    }
}
