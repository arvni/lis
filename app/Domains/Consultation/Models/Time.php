<?php

namespace App\Domains\Consultation\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Time extends Model
{
    protected $fillable = [
        "consultant_id",
        "reservable_type",
        "reservable_id",
        "title",
        "started_at",
        "ended_at",
        "active",
    ];
    protected $casts=[
        "active"=>"boolean",
    ];

    public function consultant()
    {
        return $this->belongsTo(Consultant::class);
    }

    public function reservable(): MorphTo
    {
        return $this->morphTo();
    }

}
