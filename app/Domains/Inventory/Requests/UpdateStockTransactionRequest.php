<?php

namespace App\Domains\Inventory\Requests;

class UpdateStockTransactionRequest extends StoreStockTransactionRequest
{
    public function rules(): array
    {
        $rules = parent::rules();
        unset($rules['transaction_type']);

        return $rules;
    }
}
