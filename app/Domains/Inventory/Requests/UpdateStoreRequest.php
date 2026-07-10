<?php

namespace App\Domains\Inventory\Requests;

use App\Domains\Inventory\Models\Store;
use Illuminate\Validation\Rule;

class UpdateStoreRequest extends StoreStoreRequest
{
    public function rules(): array
    {
        /** @var Store $store */
        $store = $this->route('store');

        $rules = parent::rules();
        $rules['code'] = ['required', 'string', 'max:50', Rule::unique('stores', 'code')->ignore($store->id)];
        $rules['is_active'] = 'boolean';

        return $rules;
    }
}
