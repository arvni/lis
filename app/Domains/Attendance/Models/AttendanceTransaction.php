<?php

declare(strict_types=1);

namespace App\Domains\Attendance\Models;

use App\Domains\User\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * A raw door punch, written by HikCentral Access Control (third-party database mode) or imported
 * from an Excel file. `attendance_id` is the HikCentral Employee ID, which matches
 * users.attendance_number when the person is known to the LIS.
 *
 * @property int $id
 * @property string $attendance_id
 * @property Carbon $access_date_and_time
 * @property Carbon|null $access_date
 * @property string|null $access_time
 * @property int|null $imported_by null when HikCentral wrote the punch
 * @property Carbon|null $created_at
 */
class AttendanceTransaction extends Model
{
    public const UPDATED_AT = null;

    protected $casts = [
        'access_date_and_time' => 'datetime',
        'access_date' => 'date:Y-m-d',
    ];

    /** @return BelongsTo<User, $this> */
    public function importer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'imported_by');
    }
}
