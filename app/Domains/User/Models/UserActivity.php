<?php

namespace App\Domains\User\Models;

use App\Domains\User\Enums\ActivityType;
use Illuminate\Database\Eloquent\Model;

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

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function related()
    {
        return $this->morphTo();
    }
}
