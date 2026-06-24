<?php

namespace App\Domains\Reception\Models;

use App\Domains\User\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $report_id
 * @property int $user_id
 * @property int $row
 * @property string $name
 * @property string|null $title
 * @property string|null $signature
 * @property string|null $stamp
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
class Signer extends Model
{
    protected $fillable = [
        "title",
        "name",
        "row",
        "signature",
        "stamp",
    ];

    /** @return BelongsTo<Report, $this> */
    public function report(): BelongsTo
    {
        return $this->belongsTo(Report::class);
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
