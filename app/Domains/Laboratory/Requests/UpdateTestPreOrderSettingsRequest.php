<?php

declare(strict_types=1);

namespace App\Domains\Laboratory\Requests;

use App\Domains\Laboratory\Adapters\PreOrderAdapter;
use Closure;
use Illuminate\Foundation\Http\FormRequest;

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
        ];
    }
}
