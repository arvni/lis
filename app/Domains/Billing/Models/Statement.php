<?php

namespace App\Domains\Billing\Models;

use App\Domains\Reception\Models\Acceptance;
use App\Domains\Referrer\Models\Referrer;
use Illuminate\Database\Eloquent\Model;

class Statement extends Model
{
    protected $fillable = [
        "no",
        "issue_date",
        "referrer_id"
    ];

    public function acceptances()
    {
        return $this->hasManyThrough(Acceptance::class,Invoice::class);
    }

    public function referrer()
    {
        return $this->belongsTo(Referrer::class);
    }

    public function invoices()
    {
        return $this->hasMany(Invoice::class);
    }
}
