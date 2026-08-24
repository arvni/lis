<?php

declare(strict_types=1);

namespace App\Domains\Billing\Requests;

use App\Domains\Billing\Models\DiscountCard;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class IssueDiscountCardsRequest extends FormRequest
{
    /** A single run is capped so an accidental extra zero cannot mint 100k cards. */
    private const MAX_QUANTITY = 5000;

    public function authorize(): bool
    {
        return Gate::allows('issue', DiscountCard::class);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'discount_partner_id' => 'required|exists:discount_partners,id',
            'quantity' => 'required|integer|min:1|max:'.self::MAX_QUANTITY,
            'prefix' => 'nullable|string|max:16|regex:/^[A-Za-z0-9\-]+$/',
            'expires_at' => 'nullable|date|after:today',
            'usage_limit' => 'nullable|integer|min:1',
            'notes' => 'nullable|string|max:1000',
            'activate_immediately' => 'boolean',
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'discount_partner_id.required' => 'Choose the partner these cards belong to.',
            'quantity.max' => 'A single batch cannot exceed '.self::MAX_QUANTITY.' cards.',
            'prefix.regex' => 'The prefix may only contain letters, numbers and dashes.',
            'expires_at.after' => 'The expiry date must be in the future.',
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('activate_immediately') && is_string($this->activate_immediately)) {
            $this->merge([
                'activate_immediately' => filter_var($this->activate_immediately, FILTER_VALIDATE_BOOLEAN),
            ]);
        }
    }
}
