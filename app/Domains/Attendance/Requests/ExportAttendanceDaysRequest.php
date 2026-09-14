<?php

declare(strict_types=1);

namespace App\Domains\Attendance\Requests;

use App\Domains\Attendance\Enums\AttendanceStatus;
use App\Domains\Attendance\Models\AttendanceDay;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class ExportAttendanceDaysRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('export', AttendanceDay::class);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'filters' => 'nullable|array',
            'filters.user' => 'nullable|array',
            'filters.user.id' => 'nullable|integer',
            'filters.status' => ['nullable', Rule::enum(AttendanceStatus::class)],
            'filters.from_date' => 'nullable|date_format:Y-m-d',
            'filters.to_date' => 'nullable|date_format:Y-m-d|after_or_equal:filters.from_date',
            'filters.corrected' => 'nullable',
        ];
    }
}
