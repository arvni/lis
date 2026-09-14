<?php

declare(strict_types=1);

namespace App\Domains\Attendance\Requests;

use App\Domains\Attendance\Models\AttendanceDay;
use Illuminate\Support\Facades\Gate;

class ExportAttendanceSummaryRequest extends ShowAttendanceCalendarRequest
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
            'month' => 'nullable|date_format:Y-m',
        ];
    }
}
