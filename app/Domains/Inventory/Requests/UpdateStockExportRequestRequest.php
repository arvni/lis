<?php

declare(strict_types=1);

namespace App\Domains\Inventory\Requests;

use Illuminate\Contracts\Validation\Validator;

class UpdateStockExportRequestRequest extends StoreStockExportRequestRequest
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

    public function withValidator(Validator $validator): void
    {
        // Skip the stock-availability guard on action-only requests (no lines submitted)
        if ($this->input('action')) {
            return;
        }

        parent::withValidator($validator);
    }
}
