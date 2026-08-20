<?php

declare(strict_types=1);

namespace App\Domains\Reception\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateAcceptanceItemRequest extends FormRequest
{
    public function rules(): array
    {
        // The test/panel editor payload is a deeply nested structure that is
        // already validated client-side and re-shaped server-side by
        // AcceptanceService::prepareAcceptanceItems(). We validate the envelope
        // and the price/discount leaves that we persist.
        return [
            'tests' => ['sometimes', 'array'],
            'tests.*.price' => ['required_with:tests', 'numeric', 'min:0'],
            'tests.*.discount' => ['nullable', 'numeric', 'min:0'],
            // The editor can point an item at another test, so the method test
            // it lands on is validated rather than trusted.
            'tests.*.method_test.id' => ['required_with:tests', 'integer', Rule::exists('method_tests', 'id')],
            'panels' => ['sometimes', 'array'],
            'panels.*.price' => ['required_with:panels', 'numeric', 'min:0'],
            'panels.*.discount' => ['nullable', 'numeric', 'min:0'],
            'panels.*.acceptanceItems.*.method_test.id' => ['required_with:panels', 'integer', Rule::exists('method_tests', 'id')],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            if (empty($this->input('tests')) && empty($this->input('panels'))) {
                $validator->errors()->add('tests', 'No items were provided to update.');
            }

            foreach (['tests', 'panels'] as $bucket) {
                foreach ($this->input($bucket, []) as $index => $item) {
                    $price = (float)($item['price'] ?? 0);
                    $discount = (float)($item['discount'] ?? 0);
                    if ($discount > $price) {
                        $validator->errors()->add(
                            "$bucket.$index.discount",
                            'The discount cannot be greater than the price.'
                        );
                    }
                }
            }
        });
    }
}
