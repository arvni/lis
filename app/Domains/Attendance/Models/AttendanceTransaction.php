<?php

declare(strict_types=1);

namespace App\Domains\Attendance\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * A raw door punch, written by HikCentral Access Control (third-party database mode).
 * The LIS only reads these rows; `attendance_id` is the HikCentral Employee ID, which
 * matches users.attendance_number when the person is known to the LIS.
 *
 * @property int $id
 * @property string $attendance_id
 * @property Carbon $access_date_and_time
 * @property Carbon|null $access_date
 * @property string|null $access_time
 * @property Carbon|null $created_at
 */
class AttendanceTransaction extends Model
{
    public const UPDATED_AT = null;

    protected $casts = [
        'access_date_and_time' => 'datetime',
        'access_date' => 'date:Y-m-d',
    ];
}
