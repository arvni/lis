<?php

namespace App\Domains\User\Models;

use App\Domains\User\Enums\ActivityType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

/**
 * @property int $id
 * @property int $user_id
 * @property \App\Domains\User\Enums\ActivityType $activity_type
 * @property string|null $ip_address
 * @property string|null $related_type
 * @property string|null $related_id
 * @property array<array-key, mixed>|null $payload
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
class UserActivity extends Model
{
    protected $fillable = [
        'user_id',
        'activity_type',
        'ip_address',
        'payload',
    ];

    protected $casts = [
        "payload" => "json",
        "activity_type" => ActivityType::class,
    ];

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function related(): MorphTo
    {
        return $this->morphTo();
    }
}
