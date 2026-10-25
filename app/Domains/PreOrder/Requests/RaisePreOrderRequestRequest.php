<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\Requests;

use App\Domains\PreOrder\Enums\RequestType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RaisePreOrderRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('review', $this->route('preOrder')) ?? false;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'types' => ['required', 'array', 'min:1'],
            'types.*' => ['required', 'distinct', Rule::enum(RequestType::class)],
            'reason' => ['required', 'string', 'max:64'],
            'message' => ['required', 'string', 'max:5000'],
            'blocking' => ['boolean'],
            'due_at' => ['nullable', 'date', 'after:today'],
            'needs' => ['nullable', 'array'],
            'needs.samples' => ['nullable', 'array', 'max:10'],
            'needs.samples.*.patient_ref' => ['nullable', 'string', 'max:64'],
            'needs.samples.*.sample_type' => ['required', 'string', 'max:100'],
            'needs.samples.*.count' => ['required', 'integer', 'min:1', 'max:20'],
            'needs.documents' => ['nullable', 'array', 'max:10'],
            'needs.documents.*' => ['string', 'max:64'],
            // Additional tests, for a request of type test.
            'tests' => ['nullable', 'required_if:types.*,test', 'array', 'max:10'],
            'tests.*.test_id' => ['required', 'integer', 'exists:tests,id', 'distinct'],
            'tests.*.method_test_id' => ['nullable', 'integer', 'exists:method_tests,id'],
            'tests.*.patient_ref' => ['nullable', 'string', 'max:64'],
            'tests.*.qty' => ['nullable', 'integer', 'min:1', 'max:20'],
            // Only for a test the catalogue can't price; the workflow refuses it otherwise.
            'tests.*.unit_price' => ['nullable', 'numeric', 'min:0', 'max:999999', $this->financeOnly()],
            'retest' => ['boolean'],
            'discount' => ['nullable', 'numeric', 'min:0', 'max:999999', $this->financeOnly()],
        ];
    }

    private function financeOnly(): \Closure
    {
        return function (string $attribute, mixed $value, \Closure $fail): void {
            if ($value !== null && ! $this->user()?->can('quote', $this->route('preOrder'))) {
                $fail('Only the finance team can set prices or discounts.');
            }
        };
    }
}
