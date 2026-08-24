<?php

declare(strict_types=1);

namespace App\Domains\Billing\Requests;

use App\Domains\Billing\Models\DiscountCard;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class DiscountUsageReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('viewUsage', DiscountCard::class);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'filters' => 'nullable|array',
            'filters.from_date' => 'nullable|date',
            'filters.to_date' => 'nullable|date|after_or_equal:filters.from_date',
            'filters.discount_partner_id' => 'nullable|exists:discount_partners,id',
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'filters.to_date.after_or_equal' => 'The end date must be on or after the start date.',
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function filters(): array
    {
        return (array) ($this->validated()['filters'] ?? []);
    }
}
