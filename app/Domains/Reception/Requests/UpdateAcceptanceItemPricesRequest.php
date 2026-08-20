<?php

declare(strict_types=1);

namespace App\Domains\Reception\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpdateAcceptanceItemPricesRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'items' => ['required', 'array', 'min:1'],
            // An entry addresses either a single item or a whole panel: a panel
            // is priced as one line and split across its items server-side.
            'items.*.id' => ['required_without:items.*.panel_id', 'nullable', 'integer'],
            'items.*.panel_id' => ['required_without:items.*.id', 'nullable', 'string', 'max:36'],
            'items.*.price' => ['required', 'numeric', 'min:0'],
            'items.*.discount' => ['required', 'numeric', 'min:0'],
            // Formula/conditional rows are priced from their parameters, which
            // are sent back so the item remembers what the price was built from.
            'items.*.custom_parameters' => ['sometimes', 'nullable', 'array'],
            'items.*.custom_parameters.price' => ['sometimes', 'nullable', 'array'],
            'items.*.custom_parameters.price.*' => ['nullable', 'numeric'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            foreach ($this->input('items', []) as $index => $item) {
                $price = (float)($item['price'] ?? 0);
                $discount = (float)($item['discount'] ?? 0);
                if ($discount > $price) {
                    $validator->errors()->add(
                        "items.$index.discount",
                        'The discount cannot be greater than the price.'
                    );
                }
            }
        });
    }
}
