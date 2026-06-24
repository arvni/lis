<?php

namespace App\Domains\Consultation\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $consultant_id
 * @property string|null $reservable_type
 * @property int|null $reservable_id
 * @property string $title
 * @property \Illuminate\Support\Carbon $started_at
 * @property \Illuminate\Support\Carbon $ended_at
 * @property bool $active
 * @property string|null $note
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
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
