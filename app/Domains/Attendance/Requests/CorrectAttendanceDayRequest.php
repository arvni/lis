<?php

declare(strict_types=1);

namespace App\Domains\Attendance\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class CorrectAttendanceDayRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('update', $this->route('attendanceDay'));
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            // Both empty = no punches that day (absent on a working day).
            'check_in' => 'nullable|required_with:check_out|date_format:H:i',
            'check_out' => 'nullable|date_format:H:i|after:check_in',
            // Every correction says why, since it overrides what the doors recorded.
            'note' => 'required|string|max:500',
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'check_in.required_with' => 'Enter the check-in as well as the check-out.',
            'check_out.after' => 'The check-out must be after the check-in.',
            'note.required' => 'Say why this day is being corrected.',
        ];
    }
}
