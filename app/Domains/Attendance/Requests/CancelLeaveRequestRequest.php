<?php

declare(strict_types=1);

namespace App\Domains\Attendance\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

/**
 * Cancelling. The service decides whether it may still be cancelled and explains a refusal.
 */
class CancelLeaveRequestRequest extends FormRequest
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
            'reason' => 'nullable|string|max:500',
        ];
    }
}
