<?php

namespace App\Domains\Billing\Requests;

use App\Domains\Billing\Models\Payment;
use Illuminate\Foundation\Http\FormRequest;

class DailyCashReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Financial cash report — gate on payment listing.
        return $this->user()->can("viewAny", Payment::class);
    }

    public function rules(): array
    {
        return [
            'date' => 'nullable|date',
        ];
    }
}
