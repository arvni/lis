<?php

namespace App\Domains\Reception\Requests;

use App\Domains\Reception\Models\Acceptance;
use Illuminate\Foundation\Http\FormRequest;

class ExportAcceptanceItemsRequest extends FormRequest
{
    public function authorize(): bool
    {
        // PHI export — mirror ExportAcceptancesRequest: require acceptance listing.
        return $this->user()->can("viewAny", Acceptance::class);
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
