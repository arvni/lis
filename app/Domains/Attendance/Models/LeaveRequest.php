<?php

declare(strict_types=1);

namespace App\Domains\Attendance\Models;

use App\Domains\Attendance\Enums\LeaveRequestStatus;
use App\Domains\Attendance\Enums\LeaveType;
use App\Domains\User\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * A request for leave. DAILY leave covers every working day from start_date to end_date; HOURLY leave
 * covers start_time..end_time on start_date (end_date is the same day).
 *
 * @property int $id
 * @property int $user_id the person taking the leave
 * @property int|null $requested_by who entered it
 * @property int $leave_kind_id
 * @property LeaveType $type
 * @property Carbon $start_date
 * @property Carbon $end_date
 * @property string|null $start_time "H:i:s"
 * @property string|null $end_time "H:i:s"
 * @property string|null $reason
 * @property LeaveRequestStatus $status
 * @property int|null $workflow_template_id
 * @property Carbon|null $decided_at
 * @property int|null $cancelled_by
 * @property Carbon|null $cancelled_at
 * @property string|null $cancel_reason
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class LeaveRequest extends Model
{
    protected $fillable = [
        'user_id',
        'requested_by',
        'leave_kind_id',
        'type',
        'start_date',
        'end_date',
        'start_time',
        'end_time',
        'reason',
        'status',
        'workflow_template_id',
        'decided_at',
        'cancelled_by',
        'cancelled_at',
        'cancel_reason',
    ];

    protected $casts = [
        'type' => LeaveType::class,
        'status' => LeaveRequestStatus::class,
        'start_date' => 'date:Y-m-d',
        'end_date' => 'date:Y-m-d',
        'decided_at' => 'datetime',
        'cancelled_at' => 'datetime',
    ];

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsTo<User, $this> */
    public function requestedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    /** @return BelongsTo<LeaveKind, $this> */
    public function kind(): BelongsTo
    {
        return $this->belongsTo(LeaveKind::class, 'leave_kind_id');
    }

    /** @return HasMany<LeaveRequestApproval, $this> */
    public function approvals(): HasMany
    {
        return $this->hasMany(LeaveRequestApproval::class)->orderBy('sort_order');
    }

    /** @return BelongsTo<User, $this> */
    public function cancelledBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cancelled_by');
    }
}
