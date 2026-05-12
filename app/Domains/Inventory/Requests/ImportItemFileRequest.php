<?php

namespace App\Domains\Inventory\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ImportItemFileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'file' => [
                'required', 'file', 'max:10240',
                'mimetypes:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,'
                    . 'application/vnd.ms-excel,'
                    . 'application/vnd.ms-excel.sheet.macroEnabled.12,'
                    . 'text/csv,text/plain,application/csv,application/octet-stream',
            ],
        ];
    }
}
