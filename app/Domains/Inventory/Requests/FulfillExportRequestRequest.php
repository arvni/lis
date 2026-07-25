<?php

declare(strict_types=1);

namespace App\Domains\Inventory\Requests;

use Illuminate\Foundation\Http\FormRequest;

class FulfillExportRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'notes' => 'nullable|string',
            'lines' => 'required|array|min:1',
            'lines.*.export_line_id' => 'required|exists:stock_export_request_lines,id',
            'lines.*.qty' => 'required|numeric|min:0.000001',
        ];
    }
}
