<?php

declare(strict_types=1);

namespace App\Domains\Inventory\Requests;

use Illuminate\Foundation\Http\FormRequest;

class BulkApproveExportRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'ids' => 'required|array',
            'ids.*' => 'integer',
        ];
    }
}
