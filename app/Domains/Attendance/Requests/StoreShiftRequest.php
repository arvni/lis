<?php

declare(strict_types=1);

namespace App\Domains\Attendance\Requests;

use App\Domains\Attendance\Enums\Weekday;
use App\Domains\Attendance\Models\Shift;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class StoreShiftRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('create', Shift::class);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255', Rule::unique('shifts', 'name')->ignore($this->route('shift'))],
            'description' => 'nullable|string|max:1000',
            'is_active' => 'boolean',
            // Only working weekdays are sent; a weekday that is not listed is a day off.
            'days' => 'required|array|min:1|max:7',
            'days.*.weekday' => ['required', 'integer', 'distinct', Rule::enum(Weekday::class)],
            'days.*.start_time' => 'required|date_format:H:i',
            // Hours end on the day they start: no overnight shifts.
            'days.*.end_time' => 'required|date_format:H:i|after:days.*.start_time',
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'days.required' => 'Pick at least one working day.',
            'days.min' => 'Pick at least one working day.',
            'days.*.weekday.distinct' => 'Each weekday can only appear once.',
            'days.*.end_time.after' => 'The end time must be after the start time.',
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('is_active') && is_string($this->is_active)) {
            $this->merge(['is_active' => filter_var($this->is_active, FILTER_VALIDATE_BOOLEAN)]);
        }
    }
}
