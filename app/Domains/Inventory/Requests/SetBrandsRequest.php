<?php

namespace App\Domains\Inventory\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SetBrandsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'lines'         => 'required|array',
            'lines.*.id'    => 'required|exists:purchase_request_lines,id',
            'lines.*.brand' => 'nullable|string|max:255',
        ];
    }
}
