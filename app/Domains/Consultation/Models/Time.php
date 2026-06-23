<?php

namespace App\Domains\Consultation\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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
        "note"
    ];
    protected $casts=[
        "active"=>"boolean",
        "started_at"=>"datetime",
        "ended_at"=>"datetime"
    ];

    /** @return BelongsTo<Consultant, $this> */
    public function consultant(): BelongsTo
    {
        return $this->belongsTo(Consultant::class);
    }

    public function reservable(): MorphTo
    {
        return $this->morphTo();
    }

}
