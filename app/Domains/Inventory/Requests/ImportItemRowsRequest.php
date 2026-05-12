<?php

namespace App\Domains\Inventory\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ImportItemRowsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'rows'        => 'required|array|min:1',
            'rows.*.name' => 'required|string|max:255',
        ];
    }
}
