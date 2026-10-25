<?php

declare(strict_types=1);

namespace App\Domains\Laboratory\Requests;

use App\Domains\Laboratory\Adapters\PreOrderAdapter;
use Closure;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** Switch a test on for pre-orders (by giving it a flow) or off (no flow). */
class UpdateTestPreOrderSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('PreOrders.Flows.Manage') ?? false;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'flow_id' => [
                'nullable',
                'integer',
                function (string $attribute, mixed $value, Closure $fail): void {
                    if ($value !== null && ! app(PreOrderAdapter::class)->isActiveFlow((int) $value)) {
                        $fail('Pick an active flow.');
                    }
                },
            ],
            'can_be_main' => ['required', 'boolean'],
            // Questions the center answers on a pre-order for this test, e.g. genes, HLA, linkage.
            'scope' => ['nullable', 'array', 'max:10'],
            'scope.*.key' => ['required', 'string', 'regex:/^[a-z][a-z0-9_]{0,31}$/', 'distinct'],
            'scope.*.label' => ['required', 'string', 'max:64'],
            'scope.*.type' => ['required', Rule::in(['number', 'yes_no'])],
            // The answer raises the price, so the center approves a quotation first.
            'scope.*.needs_finance' => ['boolean'],
            // For numbers: the answer from which finance is needed (e.g. genes ≥ 2).
            'scope.*.threshold' => ['nullable', 'integer', 'min:1', 'max:99'],
        ];
    }
}
