<?php

namespace App\Domains\Consultation\Models;

use App\Domains\Reception\Models\Patient;
use App\Traits\Searchable;
use Illuminate\Database\Eloquent\Model;


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


    public function times()
    {
        return $this->morphMany(Time::class, "reservable");
    }

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

}
