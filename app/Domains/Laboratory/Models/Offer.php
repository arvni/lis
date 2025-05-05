<?php

namespace App\Domains\Laboratory\Models;

use App\Domains\Laboratory\Enums\OfferType;
use App\Domains\Referrer\Models\Referrer;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Offer extends Model
{
    protected $fillable = [
        "title",
        "description",
        "type",
        "amount",
        "started_at",
        "ended_at",
        "active",
    ];

    protected $casts = [
        "type" => OfferType::class,
        "started_at" => "date:Y-m-d",
        "ended_at" => "date:Y-m-d",
        "active" => "boolean"
    ];

    public function tests(): BelongsToMany
    {
        return $this->belongsToMany(Test::class, "offer_test");
    }

    public function referrers()
    {
        return $this->belongsToMany(Referrer::class, "offer_referrer");
    }

}
