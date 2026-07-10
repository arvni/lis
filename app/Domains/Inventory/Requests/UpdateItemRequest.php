<?php

namespace App\Domains\Inventory\Requests;

class UpdateItemRequest extends StoreItemRequest
{
    public function rules(): array
    {
        $rules = parent::rules();
        unset($rules['department'], $rules['material_type']);
        $rules['is_active'] = 'boolean';

        return $rules;
    }
}
