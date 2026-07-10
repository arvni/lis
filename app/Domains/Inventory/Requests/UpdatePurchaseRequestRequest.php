<?php

namespace App\Domains\Inventory\Requests;

class UpdatePurchaseRequestRequest extends StorePurchaseRequestRequest
{
    public function rules(): array
    {
        // State-transition actions (submit, approve) carry no body to validate
        if ($this->input('action')) {
            return [];
        }

        $rules = parent::rules();
        $rules['urgency'] = 'required|string';

        return $rules;
    }
}
