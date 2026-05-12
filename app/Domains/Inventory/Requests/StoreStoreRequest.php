<?php

namespace App\Domains\Inventory\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'            => 'required|string|max:255',
            'code'            => 'required|string|max:50|unique:stores,code',
            'description'     => 'nullable|string',
            'manager_user_id' => 'nullable|exists:users,id',
            'address'         => 'nullable|string',
            'notes'           => 'nullable|string',
        ];
    }
}
