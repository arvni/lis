<?php

declare(strict_types=1);

namespace App\Domains\Attendance\Models;

use App\Domains\Attendance\Enums\AttendanceStatus;
use App\Domains\User\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * One person's attendance on one day, built from HikCentral punches (or corrected by hand).
 *
 * @property int $id
 * @property int $user_id
 * @property Carbon $date
 * @property int|null $shift_id
 * @property string|null $scheduled_start "H:i:s"
 * @property string|null $scheduled_end "H:i:s"
 * @property Carbon|null $check_in
 * @property Carbon|null $check_out
 * @property AttendanceStatus $status
 * @property int $late_minutes
 * @property int $early_leave_minutes
 * @property int $worked_minutes
 * @property int $overtime_minutes minutes at work before or after the shift; all worked time on a day off or holiday
 * @property int $leave_minutes minutes of the working day covered by approved leave
 * @property bool $is_manual
 * @property string|null $note
 * @property int|null $corrected_by
 * @property Carbon|null $corrected_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class AttendanceDay extends Model
{
    protected $fillable = [
        'user_id',
        'date',
        'shift_id',
        'scheduled_start',
        'scheduled_end',
        'check_in',
        'check_out',
        'status',
        'late_minutes',
        'early_leave_minutes',
        'worked_minutes',
        'overtime_minutes',
        'leave_minutes',
        'is_manual',
        'note',
        'corrected_by',
        'corrected_at',
    ];

    protected $casts = [
        'date' => 'date:Y-m-d',
        'check_in' => 'datetime',
        'check_out' => 'datetime',
        'status' => AttendanceStatus::class,
        'late_minutes' => 'integer',
        'early_leave_minutes' => 'integer',
        'worked_minutes' => 'integer',
        'overtime_minutes' => 'integer',
        'leave_minutes' => 'integer',
        'is_manual' => 'boolean',
        'corrected_at' => 'datetime',
    ];

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsTo<Shift, $this> */
    public function shift(): BelongsTo
    {
        return $this->belongsTo(Shift::class);
    }

    /** @return BelongsTo<User, $this> */
    public function correctedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'corrected_by');
    }
}
