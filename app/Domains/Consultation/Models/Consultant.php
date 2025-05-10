<?php

namespace App\Domains\Consultation\Models;

use App\Domains\User\Models\User;
use App\Traits\Searchable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Consultant extends Model
{
    use Searchable;

    protected $fillable = [
        "user_id",
        "name",
        "title",
        "speciality",
        "avatar",
        "default_time_table",
        "active"
    ];

    protected $casts = [
        "default_time_table" => "json",
        "active" => "boolean"
    ];

    public function consultations(): HasMany
    {
        return $this->hasMany(Consultation::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function times(): HasMany
    {
        return $this->hasMany(Time::class);
    }

    public function upcomingTimes(): HasMany
    {
        return $this->hasMany(Time::class)
            ->whereDate('started_at', '>=', now("Asia/Muscat"))
            ->where("active", true);
    }

    public function upcomingConsultations(): HasMany
    {
        return $this->hasMany(Consultation::class)->whereDate('started_at', '>=', now("Asia/Muscat"));
    }

}
