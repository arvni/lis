<?php

namespace App\Domains\Billing\Requests;

use Illuminate\Foundation\Http\FormRequest;

class DailyCashReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'date' => 'nullable|date',
        ];
    }
}
