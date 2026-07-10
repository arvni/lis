<?php

namespace App\Domains\Laboratory\Requests;

use Illuminate\Support\Facades\Gate;

class UpdateOfferRequest extends StoreOfferRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Gate::allows('update', $this->route()->parameter('offer'));
    }
}
