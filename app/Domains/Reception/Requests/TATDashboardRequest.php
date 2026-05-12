<?php

namespace App\Domains\Reception\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class TATDashboardRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('Reception.TAT.View Dashboard');
    }

    public function rules(): array
    {
        return [
            'priority'   => ['nullable', 'string'],
            'section_id' => ['nullable', 'integer', 'exists:sections,id'],
            'date_from'  => ['nullable', 'date'],
            'date_to'    => ['nullable', 'date', 'after_or_equal:date_from'],
        ];
    }
}
