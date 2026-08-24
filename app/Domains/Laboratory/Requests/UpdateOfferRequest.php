<?php

namespace App\Domains\Laboratory\Requests;

use App\Domains\Laboratory\Adapters\BillingAdapter;
use App\Domains\Laboratory\Models\Offer;
use Illuminate\Contracts\Validation\Validator;
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

    /**
     * Clearing contract-only on a contracted offer would put it back in reception's
     * auto-applied list while partner cards still redeem it — the same discount
     * given away twice. Detach it from every partner first.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $offer = $this->route()->parameter('offer');

            if (! $offer instanceof Offer || ! $offer->contract_only) {
                return;
            }

            if ($this->boolean('contract_only')) {
                return;
            }

            if (app(BillingAdapter::class)->offerIsContracted($offer->id)) {
                $validator->errors()->add(
                    'contract_only',
                    'This offer is attached to a discount partner contract. Remove it from the contract before making it available to all patients.'
                );
            }
        });
    }
}
