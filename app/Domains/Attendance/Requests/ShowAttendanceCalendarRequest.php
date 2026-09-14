<?php

declare(strict_types=1);

namespace App\Domains\Attendance\Requests;

use App\Domains\Attendance\Models\AttendanceDay;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class ShowAttendanceCalendarRequest extends FormRequest
{
    /**
     * Everyone sees their own calendar; other people's need the attendance list permission.
     */
    public function authorize(): bool
    {
        return $this->isOwnCalendar() || Gate::allows('viewAny', AttendanceDay::class);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'user_id' => ['nullable', 'integer', Rule::exists('users', 'id')],
            'month' => 'nullable|date_format:Y-m',
        ];
    }

    /** The person whose month is asked for; null means the viewer. */
    public function personId(): ?int
    {
        $userId = $this->validated('user_id');

        return $userId ? (int) $userId : null;
    }

    /** The first day of the month asked for; this month when none is given. */
    public function firstDayOfMonth(): Carbon
    {
        $month = $this->validated('month');

        return $month
            ? Carbon::createFromFormat('Y-m-d', $month.'-01')->startOfDay()
            : Carbon::today()->startOfMonth();
    }

    protected function isOwnCalendar(): bool
    {
        $userId = $this->query('user_id');

        return $userId === null || $userId === '' || (int) $userId === (int) $this->user()?->getAuthIdentifier();
    }
}
