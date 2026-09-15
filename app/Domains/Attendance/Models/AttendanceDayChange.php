<?php

declare(strict_types=1);

namespace App\Domains\Attendance\Models;

use App\Domains\Attendance\Enums\AttendanceChangeAction;
use App\Domains\User\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * One hand edit of a person's recorded day. `before`/`after` hold check-in, check-out, status and
 * minutes; `after` is null when the day no longer applies once recalculated.
 *
 * @property int $id
 * @property int|null $attendance_day_id
 * @property int $user_id
 * @property Carbon $date
 * @property AttendanceChangeAction $action
 * @property array<string, mixed>|null $before
 * @property array<string, mixed>|null $after
 * @property string|null $note
 * @property int|null $changed_by
 * @property Carbon|null $created_at
 */
class AttendanceDayChange extends Model
{
    public const UPDATED_AT = null;

    protected $fillable = [
        'attendance_day_id',
        'user_id',
        'date',
        'action',
        'before',
        'after',
        'note',
        'changed_by',
    ];

    protected $casts = [
        'date' => 'date:Y-m-d',
        'action' => AttendanceChangeAction::class,
        'before' => 'array',
        'after' => 'array',
        'created_at' => 'datetime',
    ];

    /** @return BelongsTo<User, $this> */
    public function changedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'changed_by');
    }
}
