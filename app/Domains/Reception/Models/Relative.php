<?php

namespace App\Domains\Reception\Models;


use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Relative extends Model
{
    protected $fillable = [
        "patient_id",
        "relative_id",
        "relationship",
    ];

    public function setRelationshipAttribute($value)
    {
        // If it's an array, convert it to a comma-separated string
        $this->attributes['relationship'] = is_array($value) ? implode(',', $value) : $value;
    }

    public function getRelationshipAttribute($value)
    {
        // Return as an array
        return explode(',', $value);
    }

    /** @return BelongsTo<Patient, $this> */
    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    /** @return BelongsTo<Patient, $this> */
    public function relative(): BelongsTo
    {
        return $this->belongsTo(Patient::class, 'relative_id');
    }
}
