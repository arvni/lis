<?php

declare(strict_types=1);

namespace App\Domains\Billing\Requests;

use App\Domains\Billing\Enums\DiscountCardStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class UpdateDiscountCardRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('update', $this->route('discount_card'));
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            // EXPIRED is derived from the date, never set by hand.
            'status' => ['required', Rule::in(array_map(
                static fn (DiscountCardStatus $status): string => $status->value,
                DiscountCardStatus::assignable()
            ))],
            'expires_at' => 'nullable|date',
            'usage_limit' => 'nullable|integer|min:1',
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'status.in' => 'That is not a status a card can be set to.',
        ];
    }
}
