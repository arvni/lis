<?php

declare(strict_types=1);

namespace App\Domains\Attendance\Models;

use App\Domains\Attendance\Enums\LeaveApprovalStatus;
use App\Domains\User\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * One approval step of a leave request. Approved by a specific user, by anyone with a role, or — when
 * neither is set — by anyone who can manage leave requests.
 *
 * @property int $id
 * @property int $leave_request_id
 * @property int $sort_order
 * @property string $name
 * @property string|null $approver_role
 * @property int|null $approver_user_id
 * @property int|null $deadline_days
 * @property LeaveApprovalStatus $status
 * @property int|null $acted_by
 * @property string|null $notes
 * @property Carbon|null $acted_at
 * @property Carbon|null $due_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class LeaveRequestApproval extends Model
{
    protected $fillable = [
        'leave_request_id',
        'sort_order',
        'name',
        'approver_role',
        'approver_user_id',
        'deadline_days',
        'status',
        'acted_by',
        'notes',
        'acted_at',
        'due_at',
    ];

    protected $casts = [
        'sort_order' => 'integer',
        'deadline_days' => 'integer',
        'status' => LeaveApprovalStatus::class,
        'acted_at' => 'datetime',
        'due_at' => 'datetime',
    ];

    /** @return BelongsTo<LeaveRequest, $this> */
    public function leaveRequest(): BelongsTo
    {
        return $this->belongsTo(LeaveRequest::class);
    }

    /** @return BelongsTo<User, $this> */
    public function approverUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approver_user_id');
    }

    /** @return BelongsTo<User, $this> */
    public function actedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'acted_by');
    }
}
