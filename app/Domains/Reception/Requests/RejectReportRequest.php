<?php

namespace App\Domains\Reception\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class RejectReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('approve', $this->route()->parameter('report'));
    }

    public function rules(): array
    {
        return [
            'comment' => ['required', 'string'],
        ];
    }
}
