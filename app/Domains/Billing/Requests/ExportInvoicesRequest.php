<?php

namespace App\Domains\Billing\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ExportInvoicesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'filters'           => 'nullable|array',
            'filters.date'      => 'nullable|date',
            'filters.from_date' => 'nullable|date',
            'filters.to_date'   => 'nullable|date|after_or_equal:filters.from_date',
        ];
    }
}
