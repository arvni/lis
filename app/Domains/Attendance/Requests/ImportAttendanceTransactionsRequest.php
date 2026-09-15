<?php

declare(strict_types=1);

namespace App\Domains\Attendance\Requests;

use App\Domains\Attendance\Models\AttendanceTransaction;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class ImportAttendanceTransactionsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('import', AttendanceTransaction::class);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            // A year of punches for the whole staff fits well within 5 MB.
            'file' => 'required|file|max:5120|extensions:xlsx,xls,csv',
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'file.required' => 'Choose a file to import.',
            'file.extensions' => 'Choose an Excel (.xlsx, .xls) or CSV file.',
            'file.max' => 'The file is larger than 5 MB. Split it by month and import each part.',
        ];
    }
}
