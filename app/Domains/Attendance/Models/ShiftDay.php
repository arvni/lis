<?php

declare(strict_types=1);

namespace App\Domains\Attendance\Models;

use App\Domains\Attendance\Enums\Weekday;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * One weekday's working hours within a shift. Times are "H:i:s" strings, start before end.
 *
 * @property int $id
 * @property int $shift_id
 * @property Weekday $weekday
 * @property string $start_time
 * @property string $end_time
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class ShiftDay extends Model
{
    protected $fillable = [
        'weekday',
        'start_time',
        'end_time',
    ];

    protected $casts = [
        'weekday' => Weekday::class,
    ];

    /** @return BelongsTo<Shift, $this> */
    public function shift(): BelongsTo
    {
        return $this->belongsTo(Shift::class);
    }
}
