<?php

namespace App\Domains\Consultation\Requests;

use App\Domains\Consultation\Models\Consultant;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class StoreConsultantRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Gate::allows("create", Consultant::class);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules()
    {
        return [
            'user'=>['required','array'],
            'user.id'=>['required','exists:users,id'],
            'name' => ['required', 'string', 'min:2', 'max:100'],
            'title' => ['nullable', 'string', 'max:100'],
            'speciality' => ['nullable', 'string', 'max:100'],
            'active' => ['boolean'],
            'avatar' => ['nullable',],
            'default_time_table' => ['required', 'array'],
            'default_time_table.*' => ['array'],
            'default_time_table.*.*' => ['array'],
            'default_time_table.*.*.id' => ['numeric'],
            'default_time_table.*.*.started_at' => ['required', 'string', 'regex:/^([0-9]|0[0-9]|1[0-9]|2[0-1]):[0-5][0-9]$/'],
            'default_time_table.*.*.ended_at' => ['required', 'string', 'regex:/^([0-9]|0[0-9]|1[0-9]|2[0-1]):[0-5][0-9]$/'],
            'default_time_table.*.*.only_online' => ['boolean'],
        ];
    }

    /**
     * Get custom attributes for validator errors.
     *
     * @return array
     */
    public function attributes()
    {
        return [
            'name' => 'full name',
            'title' => 'professional title',
            'default_time_table' => 'schedule',
            'default_time_table.*.*.started_at' => 'start time',
            'default_time_table.*.*.ended_at' => 'end time',
            'default_time_table.*.*.only_online' => 'online only option',
        ];
    }

    /**
     * Get the error messages for the defined validation rules.
     *
     * @return array
     */
    public function messages()
    {
        return [
            'name.required' => 'The consultant name is required',
            'name.min' => 'The name must be at least :min characters',
            'email.email' => 'Please provide a valid email address',
            'email.unique' => 'This email address is already registered for another consultant',
            'default_time_table.required' => 'A schedule is required for the consultant',
            'default_time_table.*.*.started_at.required' => 'The start time is required for all time slots',
            'default_time_table.*.*.ended_at.required' => 'The end time is required for all time slots',
            'default_time_table.*.*.started_at.regex' => 'The start time must be in 24-hour format (e.g., 9:00 or 14:30)',
            'default_time_table.*.*.ended_at.regex' => 'The end time must be in 24-hour format (e.g., 9:00 or 14:30)',
        ];
    }

    /**
     * Prepare the data for validation.
     *
     * @return void
     */
    protected function prepareForValidation()
    {
        if ($this->has('active')) {
            $this->merge([
                'active' => $this->boolean('active'),
            ]);
        }
    }

    /**
     * Get custom validators for the defined rules.
     *
     * @param \Illuminate\Validation\Validator $validator
     * @return void
     */
    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            if ($this->has('default_time_table')) {
                // Custom validation for time slots
                $this->validateTimeTable($validator);
            }
        });
    }

    /**
     * Validate the time table for proper time slot configuration.
     *
     * @param \Illuminate\Validation\Validator $validator
     * @return void
     */
    protected function validateTimeTable($validator)
    {
        $timeTable = $this->input('default_time_table');

        if (!is_array($timeTable)) {
            return;
        }

        foreach ($timeTable as $dayIndex => $daySlots) {
            if (!is_array($daySlots)) {
                continue;
            }

            // Sort time slots by start time for overlap detection
            usort($daySlots, function ($a, $b) {
                return $this->convertTimeToMinutes($a['started_at']) - $this->convertTimeToMinutes($b['started_at']);
            });

            // Check for overlapping time slots
            for ($i = 0; $i < count($daySlots) - 1; $i++) {
                $currentSlot = $daySlots[$i];
                $nextSlot = $daySlots[$i + 1];

                if (isset($currentSlot['started_at']) && isset($currentSlot['ended_at']) &&
                    isset($nextSlot['started_at']) && isset($nextSlot['ended_at'])) {

                    $currentEndMinutes = $this->convertTimeToMinutes($currentSlot['ended_at']);
                    $nextStartMinutes = $this->convertTimeToMinutes($nextSlot['started_at']);

                    if ($currentEndMinutes > $nextStartMinutes) {
                        $dayName = $this->getDayName($dayIndex);
                        $validator->errors()->add(
                            "default_time_table.{$dayIndex}",
                            "There are overlapping time slots on {$dayName}. Please adjust the schedule."
                        );
                        break;
                    }
                }
            }

            // Validate each individual time slot
            foreach ($daySlots as $slotIndex => $slot) {
                if (isset($slot['started_at']) && isset($slot['ended_at'])) {
                    $startMinutes = $this->convertTimeToMinutes($slot['started_at']);
                    $endMinutes = $this->convertTimeToMinutes($slot['ended_at']);

                    // Check if start time is before end time
                    if ($startMinutes >= $endMinutes) {
                        $dayName = $this->getDayName($dayIndex);
                        $validator->errors()->add(
                            "default_time_table.{$dayIndex}.{$slotIndex}",
                            "On {$dayName}, the end time must be after the start time."
                        );
                    }

                    // Check business hours (9:00 to 21:00)
                    if ($startMinutes < 9 * 60) {
                        $dayName = $this->getDayName($dayIndex);
                        $validator->errors()->add(
                            "default_time_table.{$dayIndex}.{$slotIndex}.started_at",
                            "On {$dayName}, the start time cannot be earlier than 9:00."
                        );
                    }

                    if ($endMinutes > 21 * 60) {
                        $dayName = $this->getDayName($dayIndex);
                        $validator->errors()->add(
                            "default_time_table.{$dayIndex}.{$slotIndex}.ended_at",
                            "On {$dayName}, the end time cannot be later than 21:00."
                        );
                    }
                }
            }
        }
    }

    /**
     * Convert time string to minutes for comparison.
     *
     * @param string $timeString
     * @return int
     */
    protected function convertTimeToMinutes($timeString)
    {
        if (!$timeString) {
            return 0;
        }

        $parts = explode(':', $timeString);
        $hours = (int) $parts[0];
        $minutes = isset($parts[1]) ? (int) $parts[1] : 0;

        return $hours * 60 + $minutes;
    }

    /**
     * Get day name by index.
     *
     * @param int $index
     * @return string
     */
    protected function getDayName($index)
    {
        $days = [
            'Sunday',
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday',
            'Saturday'
        ];

        return $days[$index] ?? "Day {$index}";
    }
}
