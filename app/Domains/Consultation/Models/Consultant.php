<?php

namespace App\Domains\Consultation\Models;

use App\Domains\User\Models\User;
use App\Traits\Searchable;
use Illuminate\Database\Eloquent\Model;

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

    public function consultations()
    {
        return $this->hasMany(Consultation::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function times()
    {
        return $this->hasMany(Time::class);
    }
}
