<?php

namespace App\Domains\Consultation\Models;

use App\Domains\User\Models\User;
use App\Traits\Searchable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property int $user_id
 * @property string $name
 * @property string|null $title
 * @property string|null $speciality
 * @property string|null $avatar
 * @property array<array-key, mixed>|null $default_time_table
 * @property bool $active
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
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

    /** @return HasMany<Consultation, $this> */
    public function consultations(): HasMany
    {
        return $this->hasMany(Consultation::class);
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return HasMany<Time, $this> */
    public function times(): HasMany
    {
        return $this->hasMany(Time::class);
    }

    /** @return HasMany<Time, $this> */
    public function upcomingTimes(): HasMany
    {
        return $this->hasMany(Time::class)
            ->whereDate('started_at', '>=', now())
            ->where("active", true);
    }

    /** @return HasMany<Consultation, $this> */
    public function upcomingConsultations(): HasMany
    {
        return $this->hasMany(Consultation::class)->whereDate('started_at', '>=', now());
    }

}
