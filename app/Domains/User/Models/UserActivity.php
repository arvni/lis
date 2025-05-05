<?php

namespace App\Domain\User\Models;

use Illuminate\Database\Eloquent\Model;

class UserActivity extends Model
{
    protected $fillable = [
        'user_id',
        'activity_type',
        'description',
        'ip_address',
        'payload',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
