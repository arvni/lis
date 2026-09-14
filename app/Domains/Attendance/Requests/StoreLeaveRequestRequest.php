<?php

declare(strict_types=1);

namespace App\Domains\Attendance\Requests;

use App\Domains\Attendance\Enums\LeaveType;
use App\Domains\Attendance\Models\LeaveRequest;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class StoreLeaveRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        $userId = $this->input('user_id');
        $forSomeoneElse = $userId !== null && $userId !== '' && (int) $userId !== (int) $this->user()?->getAuthIdentifier();

        return $forSomeoneElse
            ? Gate::allows('createForOthers', LeaveRequest::class)
            : Gate::allows('create', LeaveRequest::class);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            // The person taking the leave; empty = whoever is submitting.
            'user_id' => ['nullable', 'integer', Rule::exists('users', 'id')],
            'leave_kind_id' => ['required', 'integer', Rule::exists('leave_kinds', 'id')->where('is_active', true)],
            'type' => ['required', Rule::enum(LeaveType::class)],
            'start_date' => 'required|date_format:Y-m-d',
            'end_date' => 'exclude_unless:type,DAILY|required|date_format:Y-m-d|after_or_equal:start_date',
            'start_time' => 'exclude_unless:type,HOURLY|required|date_format:H:i',
            'end_time' => 'exclude_unless:type,HOURLY|required|date_format:H:i|after:start_time',
            'reason' => 'nullable|string|max:1000',
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'leave_kind_id.required' => 'Pick the kind of leave.',
            'leave_kind_id.exists' => 'Pick an active kind of leave.',
            'end_date.after_or_equal' => 'The last day can’t be before the first day.',
            'end_time.after' => 'The leave has to end after it starts.',
        ];
    }
}
