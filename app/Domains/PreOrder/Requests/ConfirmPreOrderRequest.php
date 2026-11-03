<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\Requests;

use Closure;
use Illuminate\Foundation\Http\FormRequest;

/** BION confirms the tests; when a quotation is needed this is also its note, discount, prices and price values. */
class ConfirmPreOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('review', $this->route('preOrder')) ?? false;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'reason' => ['nullable', 'string', 'max:2000'],
            'discount' => ['nullable', 'numeric', 'min:0', 'max:999999', $this->financeOnly()],
            'prices' => ['nullable', 'array', 'max:30', $this->financeOnly()],
            'prices.*.item_id' => ['required', 'integer', 'distinct'],
            'prices.*.unit_price' => ['required', 'numeric', 'min:0', 'max:999999'],
            // Values a formula or conditional catalogue price is worked out from, e.g. the number
            // of embryos. Not a price, so anyone who reviews the case may enter them.
            'params' => ['nullable', 'array', 'max:30'],
            'params.*.item_id' => ['required', 'integer', 'distinct'],
            'params.*.values' => ['required', 'array', 'min:1', 'max:10'],
            'params.*.values.*' => ['required', 'numeric', 'min:0', 'max:99999'],
        ];
    }

    private function financeOnly(): Closure
    {
        return function (string $attribute, mixed $value, Closure $fail): void {
            if ($value !== null && $value !== [] && ! $this->user()?->can('quote', $this->route('preOrder'))) {
                $fail('Only the finance team can set prices or discounts.');
            }
        };
    }
}
