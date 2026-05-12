<?php

namespace App\Domains\Inventory\Requests;

use App\Domains\Inventory\Models\Store;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        /** @var Store $store */
        $store = $this->route('store');

        return [
            'name'            => 'required|string|max:255',
            'code'            => ['required', 'string', 'max:50', Rule::unique('stores', 'code')->ignore($store->id)],
            'description'     => 'nullable|string',
            'is_active'       => 'boolean',
            'manager_user_id' => 'nullable|exists:users,id',
            'address'         => 'nullable|string',
            'notes'           => 'nullable|string',
        ];
    }
}
