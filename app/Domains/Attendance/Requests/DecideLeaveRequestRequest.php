<?php

declare(strict_types=1);

namespace App\Domains\Attendance\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

/**
 * Approving a step. Whether the step is really waiting for this person is checked by the service, which
 * explains a refusal; this only keeps out people unrelated to the request.
 */
class DecideLeaveRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('view', $this->route('leaveRequest'));
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'notes' => 'nullable|string|max:500',
        ];
    }
}
