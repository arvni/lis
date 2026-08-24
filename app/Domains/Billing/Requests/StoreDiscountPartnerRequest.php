<?php

declare(strict_types=1);

namespace App\Domains\Billing\Requests;

use App\Domains\Billing\Models\DiscountPartner;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class StoreDiscountPartnerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('create', DiscountPartner::class);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'contract_no' => 'nullable|string|max:100',
            'contact' => 'nullable|array',
            'contact.person' => 'nullable|string|max:255',
            'contact.phone' => 'nullable|string|max:30',
            'contact.email' => 'nullable|email|max:255',
            'contact.address' => 'nullable|string|max:500',
            'starts_at' => 'nullable|date',
            'ends_at' => 'nullable|date|after_or_equal:starts_at',
            'active' => 'boolean',
            'notes' => 'nullable|string|max:2000',
            'offers' => 'nullable|array',
            'offers.*.id' => 'required|exists:offers,id',
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'The partner company name is required.',
            'ends_at.after_or_equal' => 'The contract end date must be on or after the start date.',
            'offers.*.id.exists' => 'One or more selected offers do not exist.',
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('active') && is_string($this->active)) {
            $this->merge(['active' => filter_var($this->active, FILTER_VALIDATE_BOOLEAN)]);
        }
    }
}
