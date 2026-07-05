<?php

namespace App\Domains\Billing\Requests;

use App\Domains\Billing\Models\Invoice;
use Illuminate\Foundation\Http\FormRequest;

class ExportInvoicesRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Financial export — gate on invoice listing.
        return $this->user()->can("viewAny", Invoice::class);
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
