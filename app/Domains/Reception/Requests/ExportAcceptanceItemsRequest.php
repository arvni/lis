<?php

namespace App\Domains\Reception\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ExportAcceptanceItemsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'filters'            => ['nullable', 'array'],
            'filters.date'       => ['nullable', 'date'],
            'filters.from_date'  => ['nullable', 'date'],
            'filters.to_date'    => ['nullable', 'date'],
        ];
    }
}
