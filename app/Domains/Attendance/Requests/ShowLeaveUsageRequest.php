<?php

declare(strict_types=1);

namespace App\Domains\Attendance\Requests;

use App\Domains\Attendance\Models\LeaveRequest;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class ShowLeaveUsageRequest extends FormRequest
{
    /**
     * Everyone sees their own leave usage; other people's and the all-staff view need leave management.
     */
    public function authorize(): bool
    {
        return (! $this->wantsStaff() && $this->isOwnUsage())
            || Gate::allows('viewUsageOfOthers', LeaveRequest::class);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'user_id' => ['nullable', 'integer', Rule::exists('users', 'id')],
            'year' => 'nullable|integer|min:2000|max:2100',
            'view' => 'nullable|in:person,staff',
        ];
    }

    /** The person whose usage is asked for; null means the viewer. */
    public function personId(): ?int
    {
        $userId = $this->validated('user_id');

        return $userId ? (int) $userId : null;
    }

    /** The calendar year asked for; this year when none is given. */
    public function year(): int
    {
        $year = $this->validated('year');

        return $year ? (int) $year : Carbon::today()->year;
    }

    public function wantsStaff(): bool
    {
        return $this->query('view') === 'staff';
    }

    private function isOwnUsage(): bool
    {
        $userId = $this->query('user_id');

        return $userId === null || $userId === '' || (int) $userId === (int) $this->user()?->getAuthIdentifier();
    }
}
