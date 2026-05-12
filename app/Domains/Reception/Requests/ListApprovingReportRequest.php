<?php

namespace App\Domains\Reception\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ListApprovingReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [];
    }
}
