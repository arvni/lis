<?php

declare(strict_types=1);

namespace App\Domains\Billing\Requests;

use Illuminate\Support\Facades\Gate;

class UpdateDiscountPartnerRequest extends StoreDiscountPartnerRequest
{
    public function authorize(): bool
    {
        return Gate::allows('update', $this->route('discount_partner'));
    }
}
