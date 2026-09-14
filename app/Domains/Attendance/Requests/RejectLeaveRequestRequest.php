<?php

declare(strict_types=1);

namespace App\Domains\Attendance\Requests;

class RejectLeaveRequestRequest extends DecideLeaveRequestRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            // A rejection is final, so the person is told why.
            'notes' => 'required|string|max:500',
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'notes.required' => 'Say why the leave is rejected.',
        ];
    }
}
