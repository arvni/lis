<?php

declare(strict_types=1);

namespace App\Domains\Attendance\Requests;

use App\Domains\Attendance\Models\AttendanceDay;
use Illuminate\Support\Facades\Gate;

class ExportAttendanceMonthRequest extends ShowAttendanceCalendarRequest
{
    /**
     * Everyone can download their own month; other people's need the attendance export permission.
     */
    public function authorize(): bool
    {
        return $this->isOwnCalendar() || Gate::allows('export', AttendanceDay::class);
    }
}
