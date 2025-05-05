<?php

namespace App\Domains\Reception\Models;


use Illuminate\Database\Eloquent\Model;

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

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function relative()
    {
        return $this->belongsTo(Patient::class, 'relative_id');
    }
}
