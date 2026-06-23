<?php

namespace App\Domains\Consultation\Models;

use App\Domains\Reception\Models\Patient;
use App\Traits\Searchable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;


class Customer extends Model
{
    use Searchable;

    protected $fillable = [
        "name",
        "phone",
        "email"
    ];
    protected $searchable = [
        "name",
        "phone"
    ];


    /** @return MorphMany<Time, $this> */
    public function times(): MorphMany
    {
        return $this->morphMany(Time::class, "reservable");
    }

    /** @return BelongsTo<Patient, $this> */
    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

}
