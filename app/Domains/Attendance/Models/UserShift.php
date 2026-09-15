<?php

declare(strict_types=1);

namespace App\Domains\Attendance\Models;

use App\Domains\User\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * A stretch of time during which a user works a shift. A user's assignments never overlap;
 * the one without an end date is still running.
 *
 * @property int $id
 * @property int $user_id
 * @property int $shift_id
 * @property Carbon $effective_from
 * @property Carbon|null $effective_to
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class UserShift extends Model
{
    protected $fillable = [
        'user_id',
        'shift_id',
        'effective_from',
        'effective_to',
    ];

    protected $casts = [
        'effective_from' => 'date:Y-m-d',
        'effective_to' => 'date:Y-m-d',
    ];

    /** @return BelongsTo<Shift, $this> */
    public function shift(): BelongsTo
    {
        return $this->belongsTo(Shift::class);
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
